import type { Facility } from "@/types/facility"

export function getFacilityNotes(description: string | null): string | null {
  if (!description) return null
  const notes = description.split(" | Source:")[0]?.trim()
  return notes || null
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
  const parts = [facility.building_name, facility.floor, facility.address].filter(
    Boolean
  )
  return parts.join(", ") || facility.address || "Singapore"
}

export function getFacilitySummary(facility: Facility): string {
  if (facility.description) {
    const withoutSource = facility.description.split(" | Source:")[0]?.trim()
    if (withoutSource && withoutSource.length > 20) return withoutSource
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
