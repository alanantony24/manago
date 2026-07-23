/** @typedef {"complete" | "partial" | "minimal"} DataQuality */

const SINGAPORE_REGIONS = [
  { name: "Central", lat: 1.29, lon: 103.85 },
  { name: "East", lat: 1.35, lon: 103.95 },
  { name: "North", lat: 1.43, lon: 103.82 },
  { name: "North-East", lat: 1.38, lon: 103.89 },
  { name: "West", lat: 1.34, lon: 103.72 },
]

const REGION_ALIASES = {
  CENTRAL: "Central",
  EAST: "East",
  NORTH: "North",
  "NORTH-EAST": "North-East",
  WEST: "West",
  INSTITUTIONS: "Central",
}

const GENERIC_NAMES = new Set([
  "public water cooler",
  "water cooler",
  "drinking water",
  "free drinking water",
  "water fountain",
  "water tap",
  "public drinking water",
  "bottle refill station",
])

const PLACEHOLDER_DETAILS = new Set([
  "no extra details",
  "none",
  "n/a",
  "na",
  "-",
  "water fountain",
  "drinking water",
])

const SINGAPORE_LANDMARKS = [
  { name: "Ang Mo Kio MRT", lat: 1.36997, lon: 103.84938 },
  { name: "Bishan MRT", lat: 1.35083, lon: 103.84845 },
  { name: "Bugis MRT", lat: 1.30021, lon: 103.85637 },
  { name: "Changi Airport", lat: 1.36442, lon: 103.99153 },
  { name: "Chinatown MRT", lat: 1.28431, lon: 103.84424 },
  { name: "City Hall MRT", lat: 1.29324, lon: 103.85204 },
  { name: "Clementi MRT", lat: 1.31519, lon: 103.76523 },
  { name: "Dhoby Ghaut MRT", lat: 1.29882, lon: 103.84582 },
  { name: "Esplanade MRT", lat: 1.29334, lon: 103.85592 },
  { name: "HarbourFront MRT", lat: 1.26538, lon: 103.82153 },
  { name: "Hougang MRT", lat: 1.37124, lon: 103.89248 },
  { name: "Jurong East MRT", lat: 1.33314, lon: 103.74237 },
  { name: "Marina Bay MRT", lat: 1.27603, lon: 103.85446 },
  { name: "Newton MRT", lat: 1.31241, lon: 103.83804 },
  { name: "Novena MRT", lat: 1.32044, lon: 103.84384 },
  { name: "Orchard MRT", lat: 1.30401, lon: 103.83199 },
  { name: "Outram Park MRT", lat: 1.28045, lon: 103.83949 },
  { name: "Paya Lebar MRT", lat: 1.31783, lon: 103.89223 },
  { name: "Punggol MRT", lat: 1.40526, lon: 103.90218 },
  { name: "Raffles Place MRT", lat: 1.28391, lon: 103.85152 },
  { name: "Sembawang MRT", lat: 1.44904, lon: 103.82011 },
  { name: "Sengkang MRT", lat: 1.39163, lon: 103.89545 },
  { name: "Serangoon MRT", lat: 1.34991, lon: 103.87364 },
  { name: "Somerset MRT", lat: 1.30035, lon: 103.83901 },
  { name: "Tampines MRT", lat: 1.35331, lon: 103.94522 },
  { name: "Tanjong Pagar MRT", lat: 1.27631, lon: 103.84649 },
  { name: "Toa Payoh MRT", lat: 1.33259, lon: 103.84735 },
  { name: "Woodlands MRT", lat: 1.43695, lon: 103.78685 },
  { name: "Yishun MRT", lat: 1.42959, lon: 103.83507 },
  { name: "Bedok MRT", lat: 1.32398, lon: 103.92994 },
  { name: "Boon Lay MRT", lat: 1.33861, lon: 103.70611 },
  { name: "Bras Basah MRT", lat: 1.29695, lon: 103.85067 },
  { name: "Buona Vista MRT", lat: 1.30731, lon: 103.79022 },
  { name: "Choa Chu Kang MRT", lat: 1.38528, lon: 103.74426 },
  { name: "Commonwealth MRT", lat: 1.31238, lon: 103.79833 },
  { name: "Dover MRT", lat: 1.31139, lon: 103.77864 },
  { name: "Expo MRT", lat: 1.33539, lon: 103.96168 },
  { name: "Jurong West MRT", lat: 1.34047, lon: 103.70568 },
  { name: "Kallang MRT", lat: 1.31145, lon: 103.87138 },
  { name: "Lavender MRT", lat: 1.30738, lon: 103.86283 },
  { name: "Little India MRT", lat: 1.30682, lon: 103.84939 },
  { name: "Marine Parade", lat: 1.30287, lon: 103.90743 },
  { name: "Pasir Ris MRT", lat: 1.37307, lon: 103.94907 },
  { name: "Queenstown MRT", lat: 1.29444, lon: 103.80608 },
  { name: "Redhill MRT", lat: 1.28962, lon: 103.81675 },
  { name: "Simei MRT", lat: 1.34321, lon: 103.95337 },
  { name: "Tai Seng MRT", lat: 1.33594, lon: 103.88774 },
  { name: "Tiong Bahru MRT", lat: 1.28631, lon: 103.82684 },
  { name: "Tuas Link MRT", lat: 1.34056, lon: 103.63687 },
]

export function normalizeWhitespace(text) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeRegion(region) {
  if (!region) return null
  const trimmed = region.trim()
  if (!trimmed) return null
  return REGION_ALIASES[trimmed.toUpperCase()] ?? trimmed
}

export function regionFromPostalCode(address) {
  const match = address?.match(/Singapore\s+(\d{6})/i)
  if (!match) return null

  const sector = parseInt(match[1].slice(0, 2), 10)
  if (sector >= 1 && sector <= 8) return "Central"
  if (sector >= 9 && sector <= 19) return "Central"
  if (sector >= 20 && sector <= 23) return "Central"
  if (sector >= 24 && sector <= 27) return "North-East"
  if (sector >= 28 && sector <= 30) return "North-East"
  if (sector >= 31 && sector <= 33) return "North-East"
  if (sector >= 34 && sector <= 37) return "East"
  if (sector >= 38 && sector <= 41) return "East"
  if (sector >= 42 && sector <= 45) return "East"
  if (sector >= 46 && sector <= 48) return "East"
  if (sector >= 49 && sector <= 52) return "North-East"
  if (sector >= 53 && sector <= 57) return "North-East"
  if (sector >= 58 && sector <= 59) return "East"
  if (sector >= 60 && sector <= 64) return "West"
  if (sector >= 65 && sector <= 68) return "West"
  if (sector >= 69 && sector <= 71) return "West"
  if (sector >= 72 && sector <= 73) return "North"
  if (sector >= 75 && sector <= 76) return "East"
  if (sector >= 77 && sector <= 78) return "North"
  if (sector >= 79 && sector <= 80) return "Central"
  if (sector >= 81 && sector <= 82) return "East"
  return null
}

export function regionFromCoordinates(lat, lon) {
  let best = SINGAPORE_REGIONS[0]
  let bestDistance = Infinity

  for (const region of SINGAPORE_REGIONS) {
    const distance =
      (lat - region.lat) ** 2 + ((lon - region.lon) * 1.2) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = region
    }
  }

  return best.name
}

export function inferRegion(item) {
  const fromField = normalizeRegion(item.region)
  if (fromField) return fromField

  const fromPostal = regionFromPostalCode(item.address)
  if (fromPostal) return fromPostal

  if (item.lat != null && item.lon != null) {
    return regionFromCoordinates(item.lat, item.lon)
  }

  return null
}

export function nearestLandmark(lat, lon, maxDistanceSq = 0.00025) {
  let best = null
  let bestDistance = Infinity

  for (const landmark of SINGAPORE_LANDMARKS) {
    const distance = (lat - landmark.lat) ** 2 + (lon - landmark.lon) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = landmark
    }
  }

  return bestDistance <= maxDistanceSq ? best : null
}

export function buildAddressFromTags(rawTags) {
  if (!rawTags) return null

  const parts = []
  if (rawTags["addr:housenumber"]) parts.push(rawTags["addr:housenumber"])
  if (rawTags["addr:street"]) parts.push(rawTags["addr:street"])
  if (parts.length === 0) return null

  return `${parts.join(" ")}, Singapore`
}

export function isGenericName(name) {
  if (!name) return true
  const lower = name.trim().toLowerCase()
  if (GENERIC_NAMES.has(lower)) return true
  if (/^water cooler\s*near\b/i.test(name)) return true
  if (/^public (drinking )?water/i.test(name)) return true
  // Bare "Water Cooler —" with no place label
  if (/^water cooler\s*[—\-–]\s*$/i.test(name)) return true
  return false
}

export function titleCaseName(name) {
  if (!name) return name

  const upperWords = new Set(["mrt", "amk", "nex", "ntu", "nus", "smu"])

  return name
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/[^a-zA-Z]/g, "")
      if (upperWords.has(bare.toLowerCase())) {
        return word.replace(bare, bare.toUpperCase())
      }
      if (word.length <= 3 && /^[a-z]+$/.test(word)) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

function isFeatureOnlyHint(text) {
  const lower = text.toLowerCase()
  const featurePhrases = [
    "wheelchair accessible",
    "bottle refill",
    "public access",
    "free to use",
    "located indoors",
    "located outdoors",
    "covered area",
    "cold water",
    "hot water",
    "well lit",
  ]
  return featurePhrases.some(
    (phrase) => lower === phrase || lower.startsWith(`${phrase}.`)
  )
}

function summarizeLocationHint(text) {
  if (!text) return null

  let hint = normalizeWhitespace(text.replace(/[.!]+$/g, ""))
  if (!hint || PLACEHOLDER_DETAILS.has(hint.toLowerCase())) return null
  if (isFeatureOnlyHint(hint)) return null

  hint = hint.replace(/^on\s+/i, "")
  hint = hint.charAt(0).toUpperCase() + hint.slice(1)

  return hint
}

export function improveName(item) {
  const rawName = item.name?.trim()
  const tags = item.raw_tags

  if (rawName && !isGenericName(rawName)) {
    return titleCaseName(rawName)
  }

  if (tags?.name && !isGenericName(tags.name)) {
    return titleCaseName(tags.name)
  }

  if (tags?.operator) {
    return `Water Cooler — ${tags.operator}`
  }

  const street = tags?.["addr:street"]
  if (street) {
    return `Water Cooler — ${street}`
  }

  const locationHint = summarizeLocationHint(
    tags?.description ?? item.details
  )
  if (locationHint) {
    return `Water Cooler — ${locationHint}`
  }

  if (item.type === "water_cooler" && item.lat != null && item.lon != null) {
    const landmark = nearestLandmark(item.lat, item.lon)
    if (landmark) {
      return `Water Cooler near ${landmark.name}`
    }
  }

  if (item.type === "water_cooler") {
    const floor = extractFloor(item.details, tags)
    const region = inferRegion(item)
    if (floor && region) {
      return `Water Cooler — ${floor} (${region})`
    }
  }

  if (rawName && !isGenericName(rawName)) {
    return titleCaseName(rawName)
  }

  if (item.type === "water_cooler") {
    return "Public Drinking Water"
  }

  return rawName ? titleCaseName(rawName) : "Unnamed Facility"
}

export function improveBuildingName(item, name) {
  if (item.address) return null

  const landmark =
    item.lat != null && item.lon != null
      ? nearestLandmark(item.lat, item.lon)
      : null
  if (landmark) return `Near ${landmark.name}`

  const region = inferRegion(item)
  if (region && isGenericName(name)) return `${region}, Singapore`

  return null
}

function normalizeDetailPart(part) {
  let text = normalizeWhitespace(part)
  text = text.replace(/^OSM tags:\s*/i, "")
  text = text.replace(/!!+/g, "!")
  text = text.replace(/\?+/g, "?")
  text = text.replace(/\.{2,}/g, ".")
  return text
}

function similarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  if (wordsA.size === 0 || wordsB.size === 0) return 0

  let overlap = 0
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++
  }

  return overlap / Math.max(wordsA.size, wordsB.size)
}

function dedupeSentences(sentences) {
  const kept = []

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().replace(/[.!?\s]+/g, " ").trim()
    if (!normalized || PLACEHOLDER_DETAILS.has(normalized)) continue

    const isDuplicate = kept.some((existing) => {
      const existingNorm = existing
        .toLowerCase()
        .replace(/[.!?\s]+/g, " ")
        .trim()
      return (
        existingNorm === normalized || similarity(existing, sentence) > 0.72
      )
    })

    if (!isDuplicate) kept.push(sentence)
  }

  return kept
}

function splitIntoSentences(text) {
  return text
    .replace(/^OSM tags:\s*/gi, "")
    .split(/(?<=[.!?])\s+|[|]/)
    .map(normalizeDetailPart)
    .filter(Boolean)
}

function parseAvailability(details) {
  const lower = details.toLowerCase()
  const availability = {}

  const patterns = [
    { key: "male", regex: /male\s*:\s*([^|]+?)(?=female|handicap|$)/i },
    { key: "female", regex: /female\s*:\s*([^|]+?)(?=male|handicap|$)/i },
    {
      key: "handicap",
      regex: /handicap\s*:\s*([^|]+?)(?=male|female|$)/i,
    },
  ]

  for (const { key, regex } of patterns) {
    const match = lower.match(regex)
    if (match) {
      availability[key] = normalizeWhitespace(match[1])
    }
  }

  return availability
}

function formatAvailability(availability) {
  const labels = {
    male: "Male toilet",
    female: "Female toilet",
    handicap: "Accessible toilet",
  }

  const parts = []
  for (const [key, label] of Object.entries(labels)) {
    const value = availability[key]
    if (!value) continue
    if (/^(unknown|n\/a|na|-)$/i.test(value)) continue
    parts.push(`${label}: ${value}`)
  }

  return parts.length > 0 ? parts.join(". ") : null
}

function buildFeatureSentences(rawTags) {
  if (!rawTags) return []

  const features = []

  if (rawTags.description) {
    const hint = summarizeLocationHint(rawTags.description)
    if (hint) features.push(hint)
  }

  if (rawTags.indoor === "yes") features.push("Located indoors")
  if (rawTags.indoor === "no") features.push("Located outdoors")
  if (rawTags.covered === "yes") features.push("Covered area")
  if (rawTags.wheelchair === "yes") features.push("Wheelchair accessible")
  if (rawTags.bottle === "yes") features.push("Bottle refill available")
  if (rawTags.fee === "no") features.push("Free to use")
  if (rawTags.access === "yes" || rawTags.access === "permissive") {
    features.push("Public access")
  }
  if (rawTags.cold_water === "yes") features.push("Cold water available")
  if (rawTags.hot_water === "yes") features.push("Hot water available")
  if (rawTags.lit === "yes") features.push("Well lit")

  return features
}

export function extractFloor(details, rawTags) {
  const sources = [details, rawTags?.level, rawTags?.["building:level"]].filter(
    Boolean
  )

  for (const source of sources) {
    const match = String(source).match(
      /(?:level|floor|lvl)\s*[#:]?\s*([A-Za-z]?\d+[A-Za-z]?|B\s*\d+)/i
    )
    if (match) {
      const level = match[1].replace(/\s+/g, "")
      return level.toUpperCase().startsWith("B")
        ? `Basement ${level.replace(/^B/i, "")}`
        : `Level ${level}`
    }
  }

  return null
}

export function cleanDetails(rawDetails, rawTags) {
  if (rawTags?.amenity === "drinking_water") {
    const tagSentences = buildFeatureSentences(rawTags)
    const unique = dedupeSentences(tagSentences)
    if (unique.length === 0) return null
    return unique.map((s) => (s.endsWith(".") ? s : `${s}.`)).join(" ")
  }

  const rawSentences = rawDetails ? splitIntoSentences(rawDetails) : []
  const tagSentences = buildFeatureSentences(rawTags)

  const narrative = rawSentences.filter((part) => {
    const lower = part.toLowerCase()
    return (
      !lower.startsWith("male:") &&
      !lower.startsWith("female:") &&
      !lower.startsWith("handicap:") &&
      !/^male;\s*unknown/i.test(lower)
    )
  })

  const availability = parseAvailability([...rawSentences, ...tagSentences].join(" "))
  const availabilityText = formatAvailability(availability)

  const combined = dedupeSentences([
    ...narrative,
    ...(availabilityText ? [availabilityText] : []),
    ...tagSentences,
  ])

  if (combined.length === 0) return null

  return combined.map((s) => (s.endsWith(".") ? s : `${s}.`)).join(" ")
}

export function inferAccessible(details, rawTags) {
  const lower = (details ?? "").toLowerCase()
  if (
    lower.includes("handicap") ||
    lower.includes("pwd") ||
    lower.includes("accessible") ||
    lower.includes("wheelchair")
  ) {
    return true
  }

  return rawTags?.wheelchair === "yes"
}

/** @returns {DataQuality} */
export function assessDataQuality(item) {
  const hasAddress = Boolean(item.address?.trim())
  const hasMeaningfulDetails = Boolean(
    item.details?.trim() && item.details.length > 15
  )
  const hasRegion = Boolean(item.region)
  const hasSpecificName = !isGenericName(item.name)

  if (hasAddress && hasSpecificName && (hasMeaningfulDetails || hasRegion)) {
    return "complete"
  }

  if (!hasAddress && !hasMeaningfulDetails && !hasSpecificName) {
    return "minimal"
  }

  if (!hasAddress || !hasMeaningfulDetails) {
    return "partial"
  }

  return "partial"
}

export function cleanFacility(item) {
  const address = item.address?.trim() || buildAddressFromTags(item.raw_tags)
  const region = inferRegion({ ...item, address })
  const details = cleanDetails(item.details, item.raw_tags)
  const name = improveName({ ...item, address, region, details })
  const floor = extractFloor(item.details, item.raw_tags)
  const building_name = improveBuildingName(
    { ...item, address, region },
    name
  )

  const cleaned = {
    id: item.id,
    type: item.type,
    name,
    lat: item.lat,
    lon: item.lon,
    source: item.source ?? null,
    details,
    region,
    address: address ?? null,
    building_name,
    floor,
    is_accessible: inferAccessible(details, item.raw_tags),
    data_quality: assessDataQuality({
      ...item,
      address,
      region,
      details,
      name,
    }),
  }

  if (item.raw_tags) {
    cleaned.raw_tags = item.raw_tags
  }

  return cleaned
}

export function loadFacilitiesFromJson(parsed) {
  if (Array.isArray(parsed)) return parsed
  return [
    ...(parsed.toilets_with_bidets ?? []),
    ...(parsed.water_coolers ?? []),
    ...(parsed.nursing_rooms ?? []),
  ]
}

export function groupFacilitiesByType(facilities) {
  return {
    toilets_with_bidets: facilities.filter((f) => f.type === "toilet_with_bidet"),
    water_coolers: facilities.filter((f) => f.type === "water_cooler"),
    nursing_rooms: facilities.filter((f) => f.type === "nursing_room"),
  }
}

export function dedupeDisplayText(text) {
  const sentences = splitIntoSentences(text)
  const unique = dedupeSentences(sentences)
  if (unique.length === 0) return text
  return unique.map((s) => (s.endsWith(".") ? s : `${s}.`)).join(" ")
}
