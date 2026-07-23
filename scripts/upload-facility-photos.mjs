/**
 * Upload local demo photos from public/facility-photos to Supabase Storage
 * and rewrite facility photo_url values + the seed manifest to public URLs.
 *
 * Usage: npm run upload-photos
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uploads into bucket `addlocation-images` under prefix `facility-photos/`.
 */
import { createClient } from "@supabase/supabase-js"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs"
import { basename, dirname, extname, join, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUCKET = "addlocation-images"
const STORAGE_PREFIX = "facility-photos"
const LOCAL_ROOT = resolve(__dirname, "../public/facility-photos")
const MANIFEST_PATH = resolve(__dirname, "../data/facility-photo-manifest.json")

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

function loadEnvFile() {
  const envPath = resolve(__dirname, "../.env.local")
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

function contentTypeFor(fileName) {
  return CONTENT_TYPES[extname(fileName).toLowerCase()] ?? "application/octet-stream"
}

function listLocalPhotos() {
  /** @type {{ slug: string, fileName: string, localPath: string, objectPath: string }[]} */
  const files = []
  if (!existsSync(LOCAL_ROOT)) return files

  for (const slug of readdirSync(LOCAL_ROOT)) {
    if (slug.startsWith("_") || slug.startsWith(".")) continue
    const dir = join(LOCAL_ROOT, slug)
    try {
      for (const fileName of readdirSync(dir)) {
        if (fileName.startsWith(".")) continue
        if (!CONTENT_TYPES[extname(fileName).toLowerCase()]) continue
        files.push({
          slug,
          fileName,
          localPath: join(dir, fileName),
          objectPath: `${STORAGE_PREFIX}/${slug}/${fileName}`,
        })
      }
    } catch {
      // skip non-directories
    }
  }

  return files
}

async function main() {
  loadEnvFile()

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    )
    process.exit(1)
  }

  const files = listLocalPhotos()
  if (files.length === 0) {
    console.error(`No local photos found under ${LOCAL_ROOT}`)
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)
  /** @type {Record<string, string[]>} */
  const photosBySlug = {}
  let uploaded = 0

  console.log(`Uploading ${files.length} photos to ${BUCKET}/${STORAGE_PREFIX}/…`)

  for (const file of files) {
    const bytes = readFileSync(file.localPath)
    const { error } = await supabase.storage.from(BUCKET).upload(file.objectPath, bytes, {
      contentType: contentTypeFor(file.fileName),
      upsert: true,
    })

    if (error) {
      console.error(`Failed ${file.objectPath}:`, error.message)
      process.exit(1)
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(file.objectPath)
      .data.publicUrl

    if (!photosBySlug[file.slug]) photosBySlug[file.slug] = []
    photosBySlug[file.slug].push(publicUrl)
    uploaded += 1
    console.log(`  ✓ ${file.objectPath}`)
  }

  for (const slug of Object.keys(photosBySlug)) {
    photosBySlug[slug].sort()
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    note:
      "Demo facility photos hosted in Supabase Storage (addlocation-images/facility-photos). Local files under public/facility-photos are optional cache only.",
    bucket: BUCKET,
    prefix: STORAGE_PREFIX,
    photos: photosBySlug,
  }

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true })
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Wrote ${basename(MANIFEST_PATH)} (${uploaded} URLs)`)

  // Rewrite any relative /facility-photos/… URLs already stored on facilities.
  const { data: rows, error: selectError } = await supabase
    .from("facilities")
    .select("id, photo_url")
    .like("photo_url", "/facility-photos/%")

  if (selectError) {
    console.error("Failed to load facilities for URL rewrite:", selectError.message)
    process.exit(1)
  }

  let rewritten = 0
  for (const row of rows ?? []) {
    const relative = row.photo_url
    const objectPath = relative.replace(/^\//, "") // facility-photos/...
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data
      .publicUrl

    const { error: updateError } = await supabase
      .from("facilities")
      .update({ photo_url: publicUrl })
      .eq("id", row.id)

    if (updateError) {
      console.error(`Failed to update facility ${row.id}:`, updateError.message)
      process.exit(1)
    }
    rewritten += 1
  }

  console.log(`Updated ${rewritten} facility photo_url rows to Storage URLs.`)
  console.log("Done. You can remove public/facility-photos from git; seed will use the manifest.")
}

main()
