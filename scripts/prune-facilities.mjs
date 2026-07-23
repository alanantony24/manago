/**
 * Prune facilities.json into a cohesive demo dataset:
 * - Reverse-geocode incomplete rows (Nominatim) / look up venue addresses (OneMap search)
 * - Fill real Singapore postal addresses where possible
 * - Drop generic / unverifiable facilities that still look incomplete
 * - Polish nursing-room entries (curated real malls only)
 *
 * Usage: node scripts/prune-facilities.mjs
 */
import { readFileSync, writeFileSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import {
  assessDataQuality,
  cleanDetails,
  groupFacilitiesByType,
  inferAccessible,
  loadFacilitiesFromJson,
  normalizeWhitespace,
} from "./facility-data-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonPath = resolve(__dirname, "../data/facilities.json")

const USER_AGENT = "manago-demo-prune/1.0 (local demo cleanup)"
const SG_BOUNDS = { minLat: 1.15, maxLat: 1.48, minLon: 103.6, maxLon: 104.1 }

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function hasPostal(address) {
  return /\b(?:Singapore\s+)?\d{6}\b/i.test(address ?? "")
}

function isGenericName(name) {
  const n = (name ?? "").toLowerCase().trim()
  if (!n) return true
  if (
    n === "public drinking water" ||
    n === "water cooler" ||
    n === "drinking water" ||
    n === "water fountain" ||
    n === "public water cooler"
  ) {
    return true
  }
  if (/^water cooler\s*near\b/i.test(n)) return true
  if (/^water cooler\s*[—\-–]\s*$/i.test(n)) return true
  // "Water Cooler — Specific Place" is a valid enriched name
  return false
}

function isFakeBuilding(building) {
  if (!building?.trim()) return true
  const b = building.trim()
  return (
    /^(Central|East|West|North|North-East), Singapore$/i.test(b) ||
    /^Near\s+/i.test(b)
  )
}

function titleCaseAddress(address) {
  if (!address) return null
  return normalizeWhitespace(
    address
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bSg\b/g, "Singapore")
      .replace(/\bMrt\b/g, "MRT")
      .replace(/\bCc\b/g, "CC")
  )
}

function polishDetails(details, rawTags) {
  let cleaned = cleanDetails(details, rawTags)
  if (!cleaned) return null

  cleaned = cleaned
    .replace(/\bmale:\s*unknown\.?/gi, "")
    .replace(/\bfemale:\s*unknown\.?/gi, "")
    .replace(/\bhandicap:\s*unknown\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim()

  return cleaned.length > 0 ? cleaned : null
}

function haversineM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function nominatimReverse(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lon))
  url.searchParams.set("format", "json")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("zoom", "18")

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  })
  if (!res.ok) return null
  return res.json()
}

async function onemapSearch(query) {
  const url = new URL(
    "https://www.onemap.gov.sg/api/common/elastic/search"
  )
  url.searchParams.set("searchVal", query)
  url.searchParams.set("returnGeom", "Y")
  url.searchParams.set("getAddrDetails", "Y")
  url.searchParams.set("pageNum", "1")

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0] ?? null
}

function addressFromNominatim(geo) {
  if (!geo?.address) return null
  const a = geo.address
  if (a.country_code && a.country_code !== "sg") return null

  const postal = a.postcode ?? null
  const road = a.road ?? a.pedestrian ?? a.path ?? null
  const house = a.house_number ?? null
  const place =
    a.shop ||
    a.amenity ||
    a.building ||
    a.tourism ||
    a.leisure ||
    geo.name ||
    null

  const lineParts = []
  if (house && road) lineParts.push(`${house} ${road}`)
  else if (road) lineParts.push(road)
  else if (place) lineParts.push(place)

  if (lineParts.length === 0 && !postal) return null

  let address = lineParts.join(", ")
  if (postal) {
    address = address
      ? `${address}, Singapore ${postal}`
      : `Singapore ${postal}`
  } else {
    address = `${address}, Singapore`
  }

  return {
    address: titleCaseAddress(address),
    postal,
    place: place && place !== "drinking_water" ? place : null,
    road,
  }
}

function addressFromOnemap(row) {
  if (!row?.ADDRESS) return null
  const postal = row.POSTAL && row.POSTAL !== "NIL" ? row.POSTAL : null
  const building =
    row.BUILDING && row.BUILDING !== "NIL" && row.BUILDING !== "null"
      ? titleCaseAddress(row.BUILDING)
      : null
  return {
    address: titleCaseAddress(row.ADDRESS),
    postal,
    building,
    lat: row.LATITUDE ? Number(row.LATITUDE) : null,
    lon: row.LONGITUDE ? Number(row.LONGITUDE) : null,
  }
}

/**
 * @param {object} facility
 * @param {{address?: string|null, building_name?: string|null, name?: string, details?: string|null, data_quality?: string}} patch
 */
function applyPatch(facility, patch) {
  const next = { ...facility, ...patch }
  next.data_quality = assessDataQuality(next)
  next.is_accessible =
    facility.is_accessible ?? inferAccessible(next.details, facility.raw_tags)
  return next
}

async function enrichToilet(facility) {
  let next = {
    ...facility,
    details: polishDetails(facility.details, facility.raw_tags),
  }

  if (isFakeBuilding(next.building_name)) {
    next.building_name = null
  }

  if (hasPostal(next.address) && !isGenericName(next.name)) {
    return applyPatch(next, {
      address: titleCaseAddress(next.address),
      building_name: next.building_name,
      details: next.details,
    })
  }

  // Look up venue by name via OneMap
  if (!isGenericName(next.name) && next.name.length >= 4) {
    await sleep(250)
    const hit = await onemapSearch(next.name)
    const mapped = addressFromOnemap(hit)
    if (mapped?.postal) {
      return applyPatch(next, {
        address: mapped.address,
        building_name: mapped.building ?? next.building_name,
        details: next.details,
      })
    }
  }

  // Fallback: reverse geocode
  await sleep(1100)
  const geo = await nominatimReverse(next.lat, next.lon)
  const mapped = addressFromNominatim(geo)
  if (mapped?.postal) {
    return applyPatch(next, {
      address: mapped.address,
      building_name:
        mapped.place && !isFakeBuilding(mapped.place)
          ? titleCaseAddress(mapped.place)
          : next.building_name,
      details: next.details,
    })
  }

  return applyPatch(next, {
    address: next.address ? titleCaseAddress(next.address) : null,
    building_name: next.building_name,
    details: next.details,
  })
}

async function enrichWaterCooler(facility) {
  await sleep(1100)
  const geo = await nominatimReverse(facility.lat, facility.lon)
  const mapped = addressFromNominatim(geo)

  if (!mapped?.postal) {
    return null // unverifiable
  }

  const placeLabel = mapped.place
    ? titleCaseAddress(mapped.place)
    : mapped.road
      ? titleCaseAddress(mapped.road)
      : null

  if (!placeLabel) return null

  const name = `Water Cooler — ${placeLabel}`
  const details = polishDetails(facility.details, facility.raw_tags)

  return applyPatch(facility, {
    name,
    address: mapped.address,
    building_name: mapped.place ? placeLabel : null,
    details,
    source: facility.source ?? "OpenStreetMap",
  })
}

function enrichNursing(facility) {
  // Drop the weak placeholder entry
  if (facility.id === "nr_29") return null
  if (/temporary market/i.test(facility.name ?? "")) return null

  return applyPatch(facility, {
    address: titleCaseAddress(facility.address),
    building_name: facility.building_name
      ? titleCaseAddress(facility.building_name)
      : titleCaseAddress(facility.name),
    details:
      polishDetails(facility.details, null) ??
      "Public nursing / baby care room.",
    source: "Curated Singapore mall & airport directory",
    floor: facility.floor,
    is_accessible: true,
  })
}

function shouldKeep(facility) {
  if (!facility) return false
  if (
    facility.lat < SG_BOUNDS.minLat ||
    facility.lat > SG_BOUNDS.maxLat ||
    facility.lon < SG_BOUNDS.minLon ||
    facility.lon > SG_BOUNDS.maxLon
  ) {
    return false
  }

  if (isGenericName(facility.name)) return false
  if (!hasPostal(facility.address)) return false
  if (isFakeBuilding(facility.building_name) && !facility.address) return false

  // Prefer cohesive complete/partial — drop remaining minimal
  if (facility.data_quality === "minimal") return false

  return true
}

function dedupeNearby(facilities, meters = 40) {
  const sorted = [...facilities].sort((a, b) => {
    const score = (f) =>
      (hasPostal(f.address) ? 4 : 0) +
      (f.details?.length > 20 ? 2 : 0) +
      (f.floor ? 1 : 0) +
      (f.data_quality === "complete" ? 3 : f.data_quality === "partial" ? 1 : 0)
    return score(b) - score(a)
  })

  /** @type {typeof facilities} */
  const kept = []
  for (const f of sorted) {
    const dup = kept.find(
      (k) =>
        k.type === f.type &&
        haversineM(
          { lat: k.lat, lon: k.lon },
          { lat: f.lat, lon: f.lon }
        ) < meters
    )
    if (!dup) kept.push(f)
  }
  return kept
}

async function main() {
  const raw = JSON.parse(readFileSync(jsonPath, "utf-8"))
  const all = loadFacilitiesFromJson(raw)
  console.log(`Loaded ${all.length} facilities`)

  /** @type {typeof all} */
  const enriched = []
  let droppedEarly = 0
  let i = 0

  for (const facility of all) {
    i += 1
    process.stdout.write(`\rEnriching ${i}/${all.length}...`)

    let next = null
    try {
      if (facility.type === "nursing_room") {
        next = enrichNursing(facility)
      } else if (facility.type === "water_cooler") {
        next = await enrichWaterCooler(facility)
      } else if (facility.type === "toilet_with_bidet") {
        next = await enrichToilet(facility)
      } else {
        next = facility
      }
    } catch (err) {
      console.warn(`\nFailed ${facility.id}: ${err.message}`)
      next = null
    }

    if (next && shouldKeep(next)) {
      enriched.push({
        id: next.id,
        type: next.type,
        name: next.name,
        lat: next.lat,
        lon: next.lon,
        source: next.source ?? null,
        details: next.details ?? null,
        region: next.region ?? null,
        address: next.address ?? null,
        building_name: isFakeBuilding(next.building_name)
          ? null
          : next.building_name ?? null,
        floor: next.floor ?? null,
        is_accessible: Boolean(next.is_accessible),
        data_quality: assessDataQuality({
          ...next,
          building_name: isFakeBuilding(next.building_name)
            ? null
            : next.building_name,
        }),
      })
    } else {
      droppedEarly += 1
    }
  }

  console.log(`\nEnriched keepers before dedupe: ${enriched.length}`)
  const deduped = dedupeNearby(enriched, 40)
  console.log(`After nearby dedupe: ${deduped.length} (dropped early: ${droppedEarly})`)

  const grouped = groupFacilitiesByType(deduped)
  const qualityCounts = { complete: 0, partial: 0, minimal: 0 }
  for (const f of deduped) {
    qualityCounts[f.data_quality] = (qualityCounts[f.data_quality] ?? 0) + 1
  }

  const output = {
    metadata: {
      description:
        "Curated public water coolers, toilets with bidets, and nursing rooms in Singapore (cleaned for demo).",
      total_toilets_with_bidets: grouped.toilets_with_bidets.length,
      total_water_coolers: grouped.water_coolers.length,
      total_nursing_rooms: grouped.nursing_rooms.length,
      last_updated: new Date().toISOString().slice(0, 19).replace("T", " "),
      last_cleaned: new Date().toISOString().slice(0, 19).replace("T", " "),
      data_quality_summary: qualityCounts,
    },
    toilets_with_bidets: grouped.toilets_with_bidets,
    water_coolers: grouped.water_coolers,
    nursing_rooms: grouped.nursing_rooms,
  }

  writeFileSync(jsonPath, JSON.stringify(output, null, 4) + "\n", "utf-8")
  console.log(`Wrote ${jsonPath}`)
  console.log(
    `  Toilets: ${grouped.toilets_with_bidets.length}, Coolers: ${grouped.water_coolers.length}, Nursing: ${grouped.nursing_rooms.length}`
  )
  console.log(
    `  Complete: ${qualityCounts.complete}, Partial: ${qualityCounts.partial}, Minimal: ${qualityCounts.minimal}`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
