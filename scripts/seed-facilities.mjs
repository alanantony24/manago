import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import {
  loadFacilitiesFromJson,
  inferAccessible,
} from "./facility-data-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

const TYPE_SLUGS = [
  "toilet_with_bidet",
  "water_cooler",
  "nursing_room",
]

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

function buildDescription(item) {
  const parts = []

  if (item.details) parts.push(item.details)
  if (item.region) parts.push(`Region: ${item.region}`)
  if (item.source) parts.push(`Source: ${item.source}`)
  if (item.data_quality) {
    parts.push(`Data quality: ${item.data_quality}`)
  }

  return parts.length > 0 ? parts.join(" | ") : null
}

function statusFromQuality(_dataQuality) {
  return "active"
}

async function main() {
  loadEnvFile()

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    const missing = []
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    console.error(`Missing in .env.local: ${missing.join(", ")}`)
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)

  const { data: amenityTypes, error: typesError } = await supabase
    .from("amenity_types")
    .select("id, slug")

  if (typesError) {
    console.error("Failed to load amenity_types:", typesError.message)
    console.error("Run supabase/setup.sql in the Supabase SQL editor first.")
    process.exit(1)
  }

  const typeIdBySlug = new Map(
    amenityTypes?.map((t) => [t.slug, t.id]) ?? []
  )

  const unknownTypes = TYPE_SLUGS.filter((slug) => !typeIdBySlug.has(slug))
  if (unknownTypes.length > 0) {
    console.error("Missing amenity types in database:", unknownTypes.join(", "))
    process.exit(1)
  }

  const jsonPath = resolve(__dirname, "../data/facilities.json")
  const parsed = JSON.parse(readFileSync(jsonPath, "utf-8"))
  const facilities = loadFacilitiesFromJson(parsed)

  if (facilities.length === 0) {
    console.error("No facilities found in data/facilities.json")
    process.exit(1)
  }

  const rows = facilities.map((item) => {
    const amenityTypeId = typeIdBySlug.get(item.type)
    if (!amenityTypeId) {
      throw new Error(`Unknown facility type "${item.type}" for id ${item.id}`)
    }

    const dataQuality = item.data_quality ?? "partial"

    return {
      external_id: item.id,
      name: item.name,
      amenity_type_id: amenityTypeId,
      latitude: item.lat,
      longitude: item.lon,
      address: item.address ?? null,
      building_name: item.building_name ?? null,
      floor: item.floor ?? null,
      description: buildDescription(item),
      photo_url: null,
      is_accessible: item.is_accessible ?? inferAccessible(item.details, item.raw_tags),
      is_verified: false,
      status: statusFromQuality(dataQuality),
    }
  })

  const qualityCounts = { complete: 0, partial: 0, minimal: 0 }
  for (const row of facilities) {
    const q = row.data_quality ?? "partial"
    qualityCounts[q] = (qualityCounts[q] ?? 0) + 1
  }

  const externalIds = rows.map((row) => row.external_id)

  console.log("Clearing previously seeded facilities...")
  const { error: deleteError } = await supabase
    .from("facilities")
    .delete()
    .in("external_id", externalIds)

  if (deleteError) {
    console.error("Failed to clear existing facilities:", deleteError.message)
    console.error(
      "Make sure the external_id column exists. Run supabase/add_external_id.sql in Supabase SQL Editor."
    )
    process.exit(1)
  }

  const BATCH_SIZE = 100
  let seeded = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from("facilities").insert(batch)

    if (error) {
      console.error(
        `Seed failed at batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error.message
      )
      process.exit(1)
    }

    seeded += batch.length
    console.log(`Inserted ${seeded}/${rows.length}...`)
  }

  console.log(`Seeded ${seeded} facilities.`)
  console.log(
    `  Complete: ${qualityCounts.complete ?? 0}, Partial: ${qualityCounts.partial ?? 0}, Minimal: ${qualityCounts.minimal ?? 0}`
  )
}

main()
