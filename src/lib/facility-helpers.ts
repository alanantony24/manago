import type { Facility } from "@/types/facility"

export type DataQuality = "complete" | "partial" | "minimal"

function stripMetadataSuffixes(description: string): string {
  return description
    .split(" | Source:")[0]
    ?.split(" | Region:")[0]
    ?.split(" | Data quality:")[0]
    ?.trim() ?? ""
}

function dedupeDisplayText(text: string): string {
  const sentences = text
    .replace(/^OSM tags:\s*/gi, "")
    .split(/(?<=[.!?])\s+|[|]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const unique: string[] = []

  for (const sentence of sentences) {
    const key = sentence.toLowerCase().replace(/[.!?\s]+/g, " ").trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(sentence.endsWith(".") ? sentence : `${sentence}.`)
  }

  return unique.join(" ")
}

export function getFacilityNotes(description: string | null): string | null {
  if (!description) return null
  const notes = dedupeDisplayText(stripMetadataSuffixes(description))
  return notes || null
}

export function getFacilityRegion(description: string | null): string | null {
  if (!description) return null
  const match = description.match(/ \| Region: ([^|]+)/)
  return match?.[1]?.trim() ?? null
}

export function getFacilityDataQuality(facility: Facility): DataQuality {
  if (facility.description) {
    const match = facility.description.match(/Data quality: (complete|partial|minimal)/)
    if (match) return match[1] as DataQuality
  }

  const hasAddress = Boolean(facility.address?.trim())
  const notes = getFacilityNotes(facility.description)
  const hasMeaningfulDetails = Boolean(notes && notes.length > 15)
  const hasRegion = Boolean(getFacilityRegion(facility.description))
  const hasSpecificName = !/^(water cooler|public (drinking )?water)/i.test(
    facility.name
  )

  if (hasAddress && hasSpecificName && (hasMeaningfulDetails || hasRegion)) {
    return "complete"
  }

  if (!hasAddress && !hasMeaningfulDetails && !hasSpecificName) {
    return "minimal"
  }

  return "partial"
}

export function getDataQualityWarning(quality: DataQuality): string | null {
  if (quality === "complete") return null
  if (quality === "partial") {
    return "Some details for this location may be incomplete. Coordinates are accurate, but address or amenity info might be missing."
  }
  return "Limited information available for this location. Only map coordinates are confirmed — please verify before visiting."
}

export function getFacilityTags(facility: Facility): string[] {
  const tags: string[] = []

  const typeLabel = facility.amenity_types?.label
  if (typeLabel?.toLowerCase().includes("bidet")) tags.push("Bidet")
  if (facility.is_accessible) tags.push("Accessible")
  if (facility.is_verified) tags.push("Verified")

  tags.push("24 Hours")

  return tags
}

export function getFacilityLocation(facility: Facility): string {
  const parts: string[] = []

  if (
    facility.building_name &&
    facility.building_name !== facility.name
  ) {
    parts.push(facility.building_name)
  }

  if (facility.floor) parts.push(facility.floor)

  if (facility.address) {
    parts.push(facility.address)
  } else if (parts.length === 0) {
    const region = getFacilityRegion(facility.description)
    if (region) return `${region}, Singapore`
  }

  return parts.join(", ") || "Singapore"
}

export function getFacilitySummary(facility: Facility): string {
  if (facility.description) {
    const withoutSource = dedupeDisplayText(
      stripMetadataSuffixes(facility.description)
    )
    if (withoutSource && withoutSource.length > 10) return withoutSource
  }

  const typeLabel = facility.amenity_types?.label ?? "facility"
  const location = facility.building_name ?? facility.name
  return `Well-maintained ${typeLabel.toLowerCase()} at ${location}. Regularly cleaned and stocked.`
}

export function formatUpdatedAt(dateString: string): string {
  const updated = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays <= 0) return "Updated today"
  if (diffDays === 1) return "Updated 1 day ago"
  return `Updated ${diffDays} days ago`
}
