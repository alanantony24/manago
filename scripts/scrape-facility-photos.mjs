/**
 * Demo-only facility photos:
 * - toilets / nursing rooms: DuckDuckGo image search with stock + off-topic filters
 * - water coolers: Wikimedia Commons only (real SG public drinking-water stations)
 *
 * Usage:
 *   npm run scrape-photos
 *   node scripts/scrape-facility-photos.mjs water_cooler
 */
import { createHash } from "crypto"
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs"
import { dirname, resolve } from "path"
import { pipeline } from "stream/promises"
import { fileURLToPath } from "url"
import { Readable } from "stream"
import { spawnSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const PHOTOS_DIR = resolve(ROOT, "public/facility-photos")
const MANIFEST_PATH = resolve(ROOT, "data/facility-photo-manifest.json")

const TARGET_PER_TYPE = 50
const TARGET_TOILETS = 20
const USER_AGENT =
  "manago-demo/1.0 (local demo; facility photo scrape)"

const QUERIES = {
  toilet_with_bidet: [
    "singapore mall public toilet interior -watermark -www",
    "Changi Airport toilet washroom interior photo",
    "Jewel Changi public toilet sinks",
    "VivoCity Singapore restroom interior",
    "Singapore MRT toilet interior photo",
    "Singapore shopping mall washroom vanity",
    "ION Orchard toilet interior Singapore",
    "Marina Bay Sands restroom interior Singapore",
  ],
  nursing_room: [
    "singapore mall nursing room interior",
    "singapore baby care room mall",
    "Jewel Changi nursing room",
    "VivoCity nursing room",
    "singapore airport nursing room interior",
    "singapore lactation room shopping mall",
    "Waterway Point nursing room",
    "singapore public nursing room changing table",
  ],
}

/** Commons search terms for real Singapore public drinking-water photos. */
const COMMONS_WATER_QUERIES = [
  "Singapore Drinking-water-station",
  "Drinking water station at Changi Airport Singapore",
  "Gemmill's drinking fountain National Museum of Singapore",
  "Drinking fountains in Singapore",
  "bottle filling Singapore airport",
]

/** Commons search terms for real Singapore public toilet / restroom photos. */
const COMMONS_TOILET_QUERIES = [
  "Elegant modern public restroom Singapore",
  "Toilet bowl with a bidet spray hose Singapore",
  "Sinks and urinals Fullerton Bay Hotel Singapore",
  "Restroom in the former NCO Club Singapore",
  "Changi Airport Accessible Toilet",
  "Male Bathroom Changi Airport",
  "Squatting Pan Changi Airport",
  "Singapore public restroom",
]

const STOCK_URL_RE =
  /shutterstock|gettyimages|istockphoto|alamy|adobe\.stock|dreamstime|depositphotos|freepik|123rf|vectorstock|rawpixel|amazon\.|alibaba\.|lazada\.|shopee\.|ebay\.|cdn\.shopify|tanthan|smartlocal|pinterest\.com/i

const STOCK_TEXT_RE =
  /\b(stock photo|for sale|buy now|add to cart|product shot|white background|office water dispenser|countertop dispenser|toilet bowl|bidet seat product|photography by|watermark|www\s*\.|designed by)\b/i

const TYPE_CONTENT = {
  toilet_with_bidet: {
    mustAny: [/\b(toilet|restroom|washroom|bathroom|lavatory|wc\b|bidet)\b/i],
    mustAll: [
      /\b(singapore|changi|vivocity|jewel|mrt|mall|orchard|airport|hawker|fullerton)\b/i,
    ],
    reject:
      /\b(waterfall|rain vortex|water cooler|drinking fountain|nursing room|baby care|lactation|toilet bowl for sale|bidet seat|www\.|photography by|watermark|3d render|architectural rendering)\b/i,
  },
  nursing_room: {
    mustAny: [
      /\b(nursing|baby care|lactation|breastfeeding|feeding room|parent room)\b/i,
    ],
    mustAll: [
      /\b(singapore|changi|vivocity|jewel|mall|airport|waterway|orchard|tampines)\b/i,
    ],
    reject: /\b(waterfall|water cooler|drinking fountain|toilet bowl|urinal)\b/i,
  },
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function clearDirImages(dir) {
  mkdirSync(dir, { recursive: true })
  for (const name of readdirSync(dir)) {
    if (name === ".gitkeep") continue
    unlinkSync(resolve(dir, name))
  }
  writeFileSync(resolve(dir, ".gitkeep"), "")
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/html, */*",
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function getVqd(query) {
  const html = await fetchText(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`
  )
  const match =
    html.match(/vqd=["']([^"']+)["']/) ??
    html.match(/vqd=([^&"']+)/) ??
    html.match(/"vqd"\s*:\s*"([^"]+)"/)
  if (!match?.[1]) throw new Error(`Could not extract vqd for: ${query}`)
  return match[1]
}

async function searchImageResults(query, vqd, s = 0) {
  const params = new URLSearchParams({
    l: "wt-wt",
    o: "json",
    q: query,
    vqd,
    f: ",,,",
    p: "1",
  })
  if (s > 0) params.set("s", String(s))
  const text = await fetchText(`https://duckduckgo.com/i.js?${params}`, {
    headers: { Referer: "https://duckduckgo.com/" },
  })
  const data = JSON.parse(text)
  return (data.results ?? [])
    .map((row) => ({
      image: row.image ?? row.thumbnail,
      title: String(row.title ?? ""),
      url: String(row.url ?? row.source ?? ""),
      width: Number(row.width) || undefined,
      height: Number(row.height) || undefined,
    }))
    .filter((r) => typeof r.image === "string" && /^https?:\/\//i.test(r.image))
}

function looksLikeStock(result) {
  const blob = `${result.image} ${result.title} ${result.url}`
  if (STOCK_URL_RE.test(blob) || STOCK_TEXT_RE.test(blob)) return true
  if (result.width && result.height && (result.width < 300 || result.height < 300)) {
    return true
  }
  return false
}

function matchesTypeContent(slug, result) {
  const rules = TYPE_CONTENT[slug]
  if (!rules) return true
  const blob = `${result.title} ${result.url}`
  if (rules.reject?.test(blob)) return false
  if (rules.mustAny && !rules.mustAny.some((re) => re.test(blob))) return false
  if (rules.mustAll && !rules.mustAll.every((re) => re.test(blob))) return false
  return true
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok || !res.body) return false
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) return false
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath))
  return true
}

function isLikelyProductShot(filePath) {
  const script = `
import sys
try:
    from PIL import Image, ImageStat, ImageFilter
except Exception:
    sys.exit(0)
img = Image.open(sys.argv[1]).convert("RGB")
w, h = img.size
if w < 280 or h < 280: sys.exit(2)
if max(w, h) / max(1, min(w, h)) > 2.6: sys.exit(2)
small = img.resize((64, 64))
px = list(small.getdata())
def near_white(p): return p[0] > 235 and p[1] > 235 and p[2] > 235
def near_black(p): return p[0] < 25 and p[1] < 25 and p[2] < 25
white = sum(1 for p in px if near_white(p)) / len(px)
black = sum(1 for p in px if near_black(p)) / len(px)
corners = [px[0], px[63], px[64*63], px[-1]]
cw = sum(1 for p in corners if near_white(p)) / 4
cb = sum(1 for p in corners if near_black(p)) / 4
avg = [sum(c[i] for c in px)/len(px) for i in range(3)]
var = sum((c[0]-avg[0])**2 + (c[1]-avg[1])**2 + (c[2]-avg[2])**2 for c in px)/len(px)
if white > 0.4 or black > 0.4: sys.exit(2)
if (cw >= 0.75 and white > 0.2) or (cb >= 0.75 and black > 0.2): sys.exit(2)
if var < 400 and (white > 0.15 or black > 0.15): sys.exit(2)
edges = small.convert("L").filter(ImageFilter.FIND_EDGES)
if ImageStat.Stat(edges).mean[0] > 28 and white > 0.25: sys.exit(2)

# Reject watermark / caption banners (dense edges in top/bottom strips)
top = img.crop((0, 0, w, max(1, h // 7))).resize((128, 28)).convert("L").filter(ImageFilter.FIND_EDGES)
bottom = img.crop((0, h - max(1, h // 8), w, h)).resize((128, 24)).convert("L").filter(ImageFilter.FIND_EDGES)
top_e = ImageStat.Stat(top).mean[0]
bot_e = ImageStat.Stat(bottom).mean[0]
# Caption bars often also have a flatter mid-tone strip
bot_rgb = img.crop((0, h - max(1, h // 10), w, h)).resize((64, 12))
bot_px = list(bot_rgb.getdata())
bot_var = sum((p[0]-sum(c[0] for c in bot_px)/len(bot_px))**2 for p in bot_px)/len(bot_px)
if bot_e > 30 and bot_var < 2500: sys.exit(2)  # flat banner with text edges
if top_e > 40: sys.exit(2)
if bot_e > 38: sys.exit(2)
sys.exit(0)
`
  return spawnSync("python3", ["-c", script, filePath]).status === 2
}

function extFromUrl(url) {
  try {
    const match = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)$/i)
    if (match) return match[1].toLowerCase().replace("jpeg", "jpg")
  } catch {
    /* ignore */
  }
  return "jpg"
}

function urlHash(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 12)
}

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    format: "json",
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`)
  const data = await res.json()
  return Object.values(data.query?.pages ?? {}).flatMap((page) => {
    const info = page.imageinfo?.[0]
    if (!info?.url || !String(info.mime ?? "").startsWith("image/")) return []
    if ((info.width ?? 0) < 500) return []
    return [{ title: page.title, url: info.url, width: info.width, height: info.height }]
  })
}

async function scrapeWaterCoolersFromCommons() {
  const slug = "water_cooler"
  const dir = resolve(PHOTOS_DIR, slug)
  clearDirImages(dir)

  const allow =
    /drinking.?water.?station|drinking.?fountain|water.?dispenser|bottle.?fill/i
  const deny =
    /inscription|lion head|year inscribed|journal|asiatic|pdf|portrait|pottery|waterfall|vortex|map|logo|poster|sign in singapore(?!.*station)/i

  /** @type {Map<string, string>} */
  const urls = new Map()
  for (const query of COMMONS_WATER_QUERIES) {
    console.log(`  [${slug}] commons: ${query}`)
    try {
      const hits = await commonsSearch(query)
      for (const hit of hits) {
        if (deny.test(hit.title)) continue
        if (!allow.test(hit.title)) continue
        if (!/singapore|changi|gardens|museum/i.test(hit.title)) continue
        urls.set(hit.url, hit.title)
      }
      await sleep(300)
    } catch (err) {
      console.warn(`  [${slug}] commons failed: ${err.message}`)
    }
  }

  /** @type {string[]} */
  const localPaths = []
  let index = 1
  for (const [url, title] of urls) {
    if (localPaths.length >= TARGET_PER_TYPE) break
    const ext = extFromUrl(url)
    const filename = `${String(index).padStart(2, "0")}.${ext}`
    const destPath = resolve(dir, filename)
    const publicPath = `/facility-photos/${slug}/${filename}`
    try {
      const ok = await downloadImage(url, destPath)
      if (!ok) continue
      if (isLikelyProductShot(destPath)) {
        unlinkSync(destPath)
        continue
      }
      localPaths.push(publicPath)
      console.log(`  [${slug}] ${localPaths.length}: ${title.slice(0, 70)}`)
      index += 1
    } catch {
      try {
        unlinkSync(destPath)
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`  [${slug}] done — ${localPaths.length} Commons photos`)
  return localPaths
}

async function scrapeToiletsCurated() {
  const slug = "toilet_with_bidet"
  const dir = resolve(PHOTOS_DIR, slug)
  clearDirImages(dir)

  // Commons-only (same strategy as water coolers): real SG public toilets, no DDG watermark spam.
  const allow =
    /toilet|restroom|washroom|bathroom|bidet|urinal|squatting pan|accessible toi|changing room bathroom/i
  const deny =
    /latrine|agricultural|bulletin|journal|pdf|police|spray painted|uncle|ship hotel|ntuc|lock-up|supreme court|world toilet day|celebration|roadshow|temporary gender|wikimania|cistern outside|graffiti|vehicle|map|logo|waterfall|nursing|watermark|www\./i

  const queries = [
    ...COMMONS_TOILET_QUERIES,
    "toilets in Singapore",
    "Male Barthroom in the Changi Airport",
    "Toilet, Singapore",
    "Lavender V Hotel bathroom toilet Singapore",
    "Changi Airport Accessible Toiet",
  ]

  /** @type {Map<string, string>} */
  const urls = new Map()
  for (const query of queries) {
    console.log(`  [${slug}] commons: ${query}`)
    try {
      const hits = await commonsSearch(query)
      for (const hit of hits) {
        if (deny.test(hit.title)) continue
        if (!allow.test(hit.title)) continue
        if (!/singapore|changi|fullerton/i.test(hit.title)) continue
        urls.set(hit.url, hit.title)
      }
      await sleep(250)
    } catch (err) {
      console.warn(`  [${slug}] commons failed: ${err.message}`)
    }
  }

  /** @type {string[]} */
  const localPaths = []
  let index = 1
  for (const [url, title] of urls) {
    if (localPaths.length >= TARGET_TOILETS) break
    const ext = extFromUrl(url)
    const filename = `${String(index).padStart(2, "0")}.${ext}`
    const destPath = resolve(dir, filename)
    const publicPath = `/facility-photos/${slug}/${filename}`
    try {
      const ok = await downloadImage(url, destPath)
      if (!ok) continue
      localPaths.push(publicPath)
      console.log(`  [${slug}] ${localPaths.length}: ${title.slice(0, 70)}`)
      index += 1
    } catch {
      try {
        unlinkSync(destPath)
      } catch {
        /* ignore */
      }
    }
  }

  console.log(
    `  [${slug}] done — ${localPaths.length} Commons toilet photos (rotating pool)`
  )
  return localPaths
}

/**
 * @param {string} slug
 * @param {string[]} queries
 * @param {{ clear?: boolean, target?: number, startIndex?: number, existing?: string[] }} [opts]
 */
async function scrapeType(slug, queries, opts = {}) {
  const dir = resolve(PHOTOS_DIR, slug)
  const target = opts.target ?? TARGET_PER_TYPE
  const clear = opts.clear ?? true
  /** @type {string[]} */
  const localPaths = opts.existing ? [...opts.existing] : []
  let index = opts.startIndex ?? 1

  if (clear) clearDirImages(dir)

  const seenHashes = new Set()
  let skippedStock = 0
  let skippedOffTopic = 0
  let skippedProduct = 0

  for (const query of queries) {
    if (localPaths.length >= target) break
    console.log(`  [${slug}] searching: ${query}`)

    let vqd
    try {
      vqd = await getVqd(query)
    } catch (err) {
      console.warn(`  [${slug}] vqd failed: ${err.message}`)
      continue
    }

    for (const offset of [0, 100, 200, 300]) {
      if (localPaths.length >= target) break
      let results = []
      try {
        results = await searchImageResults(query, vqd, offset)
        await sleep(800)
      } catch (err) {
        console.warn(`  [${slug}] search failed: ${err.message}`)
        break
      }

      for (const result of results) {
        if (localPaths.length >= target) break
        if (looksLikeStock(result)) {
          skippedStock += 1
          continue
        }
        if (!matchesTypeContent(slug, result)) {
          skippedOffTopic += 1
          continue
        }

        const hash = urlHash(result.image)
        if (seenHashes.has(hash)) continue
        seenHashes.add(hash)

        const ext = extFromUrl(result.image)
        const filename = `${String(index).padStart(2, "0")}.${ext}`
        const destPath = resolve(dir, filename)
        const publicPath = `/facility-photos/${slug}/${filename}`

        try {
          const ok = await downloadImage(result.image, destPath)
          if (!ok) continue
          if (isLikelyProductShot(destPath)) {
            unlinkSync(destPath)
            skippedProduct += 1
            continue
          }
          localPaths.push(publicPath)
          index += 1
          process.stdout.write(
            `  [${slug}] ${localPaths.length}/${target}\r`
          )
          await sleep(200)
        } catch {
          try {
            unlinkSync(destPath)
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  console.log(
    `  [${slug}] done — ${localPaths.length}/${target} (skipped stock ${skippedStock}, off-topic ${skippedOffTopic}, product ${skippedProduct})`
  )
  return localPaths
}

async function main() {
  mkdirSync(PHOTOS_DIR, { recursive: true })
  const only = process.argv[2]

  /** @type {Record<string, string[]>} */
  let manifest = {
    toilet_with_bidet: [],
    water_cooler: [],
    nursing_room: [],
  }

  if (existsSync(MANIFEST_PATH) && only) {
    try {
      const prev = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"))
      manifest = { ...manifest, ...(prev.photos ?? {}) }
    } catch {
      /* ignore */
    }
  }

  const runToilet = !only || only === "toilet_with_bidet"
  const runCooler = !only || only === "water_cooler"
  const runNursing = !only || only === "nursing_room"

  if (runToilet) {
    console.log("\nScraping toilet_with_bidet (Wikimedia Commons only, ~20 max)...")
    manifest.toilet_with_bidet = await scrapeToiletsCurated()
  }

  if (runCooler) {
    console.log("\nScraping water_cooler (Wikimedia Commons)...")
    manifest.water_cooler = await scrapeWaterCoolersFromCommons()
  }

  if (runNursing) {
    console.log("\nScraping nursing_room...")
    manifest.nursing_room = await scrapeType(
      "nursing_room",
      QUERIES.nursing_room
    )
  }

  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        note: "Demo-only. Water coolers + toilets prefer Wikimedia Commons; DDG fill with watermark/stock filters. ~20 toilet photos rotated.",
        photos: manifest,
      },
      null,
      2
    ) + "\n"
  )

  console.log(
    `\nWrote manifest — ${Object.entries(manifest)
      .map(([k, v]) => `${k}: ${v.length}`)
      .join(", ")}`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
