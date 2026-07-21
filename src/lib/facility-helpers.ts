import type { Facility } from "@/types/facility"

export type DataQuality = "complete" | "partial" | "minimal"

// When facilities are seeded, the description column is stored as a single
// string with tagged metadata, for example:
//   "Unisex toilet. | Region: East | Source: OSM | Data quality: partial"
// This splits that string back into the human-readable notes and the tags.
function parseDescription(description: string | null) {
  let notes = ""
  let region: string | null = null
  let quality: DataQuality | null = null

  for (const segment of (description ?? "").split(" | ")) {
    const part = segment.trim()

    if (part.startsWith("Region:")) {
      region = part.slice("Region:".length).trim() || null
    } else if (part.startsWith("Data quality:")) {
      const value = part.slice("Data quality:".length).trim()
      if (value === "complete" || value === "partial" || value === "minimal") {
        quality = value
      }
    } else if (part.startsWith("Source:")) {
      // Internal metadata, not shown to users.
    } else if (!notes) {
      notes = part
    }
  }

  return { notes, region, quality }
}

export function getFacilityNotes(description: string | null): string | null {
  return parseDescription(description).notes || null
}

export function getFacilityRegion(description: string | null): string | null {
  return parseDescription(description).region
}

export function getFacilityDataQuality(facility: Facility): DataQuality {
  const { notes, region, quality } = parseDescription(facility.description)
  if (quality) return quality

  // Fallback for rows without a stored quality tag.
  const hasAddress = Boolean(facility.address?.trim())
  const hasDetails = notes.length > 15

  if (hasAddress && (hasDetails || region)) return "complete"
  if (!hasAddress && !hasDetails) return "minimal"
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

  if (facility.amenity_types?.label?.toLowerCase().includes("bidet")) {
    tags.push("Bidet")
  }
  if (facility.is_accessible) tags.push("Accessible")
  if (facility.is_verified) tags.push("Verified")

  return tags
}

export function getFacilityLocation(facility: Facility): string {
  const parts: string[] = []

  if (facility.building_name && facility.building_name !== facility.name) {
    parts.push(facility.building_name)
  }
  if (facility.floor) parts.push(facility.floor)
  if (facility.address) parts.push(facility.address)

  if (parts.length > 0) return parts.join(", ")

  const region = getFacilityRegion(facility.description)
  return region ? `${region}, Singapore` : "Singapore"
}

export function getFacilitySummary(facility: Facility): string | null {
  return getFacilityNotes(facility.description)
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
