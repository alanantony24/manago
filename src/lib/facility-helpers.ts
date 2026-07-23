import type { Facility } from "@/types/facility"

export type DataQuality = "complete" | "partial" | "minimal"

/**
 * Seeded facilities pack metadata into `description` as:
 *   "Notes… | Region: East | Source: OSM | Data quality: partial"
 * This splits that string into notes + region + quality.
 */
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

/** Human-readable notes from a packed description (no metadata tags). */
export function getFacilityNotes(description: string | null): string | null {
  return parseDescription(description).notes || null
}

/** Region tag from a packed description, if present. */
export function getFacilityRegion(description: string | null): string | null {
  return parseDescription(description).region
}

/** Data completeness for UI warnings (stored tag or inferred). */
export function getFacilityDataQuality(facility: Facility): DataQuality {
  const { notes, region, quality } = parseDescription(facility.description)
  if (quality) return quality

  const hasAddress = Boolean(facility.address?.trim())
  const hasDetails = notes.length > 15

  if (hasAddress && (hasDetails || region)) return "complete"
  if (!hasAddress && !hasDetails) return "minimal"
  return "partial"
}

/** User-facing warning for incomplete facility data, or null when complete. */
export function getDataQualityWarning(quality: DataQuality): string | null {
  if (quality === "complete") return null
  if (quality === "partial") {
    return "Some details for this location may be incomplete. Coordinates are accurate, but address or amenity info might be missing."
  }
  return "Limited information available for this location. Only map coordinates are confirmed — please verify before visiting."
}

/** Short filter chips derived from amenity / accessibility flags. */
export function getFacilityTags(facility: Facility): string[] {
  const tags: string[] = []

  if (facility.amenity_types?.label?.toLowerCase().includes("bidet")) {
    tags.push("Bidet")
  }
  if (facility.is_accessible) tags.push("Accessible")

  return tags
}

/** One-line location string for cards and detail headers. */
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

/** Alias for getFacilityNotes used on detail summaries. */
export function getFacilitySummary(facility: Facility): string | null {
  return getFacilityNotes(facility.description)
}

/** Relative "Updated …" string for facility timestamps. */
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

const PLACEHOLDER_PHOTO = "/toilet.jpg"

/**
 * Demo scrapes under /facility-photos are gitignored and not deployed.
 * Treat those (and empty) URLs as missing so cards don't 404.
 */
function isDeployablePhotoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith("/facility-photos/")) return false
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const path = new URL(trimmed).pathname
      if (path.startsWith("/facility-photos/")) return false
    }
  } catch {
    return false
  }
  return true
}

/** Prefer a deployable photo_url; otherwise the tracked placeholder. */
export function getFacilityPhotoUrl(
  facility: Pick<Facility, "photo_url" | "amenity_types">
): string {
  if (facility.photo_url && isDeployablePhotoUrl(facility.photo_url)) {
    return facility.photo_url
  }
  return PLACEHOLDER_PHOTO
}
