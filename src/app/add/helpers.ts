/** Shared helpers and types for the contribute-a-facility form. */

import { isPrimaryAmenitySlug } from "@/lib/amenity"
import type { AmenityType as BaseAmenityType } from "@/types/facility"

export type MapboxSuggestion = {
  id: string
  place_name: string
  center: [number, number]
}

export type AmenityType = BaseAmenityType & {
  icon: string | null
}

export type FeatureType = {
  id: number
  slug: string
  label: string
  icon: string | null
}

export type FieldErrors = {
  facility: boolean
  location: boolean
  floor: boolean
  openingHours: boolean
  image: boolean
}

export const EMPTY_FIELD_ERRORS: FieldErrors = {
  facility: false,
  location: false,
  floor: false,
  openingHours: false,
  image: false,
}

/** Normalize a label/slug for fuzzy overlap checks. */
function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

/** Keep the first occurrence of each slug (case-insensitive). */
export function dedupeBySlug<T extends { id: number; slug: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.slug.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Drop amenity rows that share a slug or a normalized label (e.g. two
 * "Toilet with Bidet" rows with different slugs). Prefer primary focus types.
 */
export function dedupeAmenityTypes(items: AmenityType[]) {
  const preferredFirst = [...items].sort((a, b) => {
    const aRank = isPrimaryAmenitySlug(a.slug) ? 0 : 1
    const bRank = isPrimaryAmenitySlug(b.slug) ? 0 : 1
    return aRank - bRank
  })

  const seenSlugs = new Set<string>()
  const seenLabels = new Set<string>()

  return preferredFirst.filter((item) => {
    const slugKey = item.slug.toLowerCase()
    const labelKey = normalizeKey(item.label)
    if (seenSlugs.has(slugKey) || seenLabels.has(labelKey)) return false
    seenSlugs.add(slugKey)
    seenLabels.add(labelKey)
    return true
  })
}

/**
 * Hide feature chips that duplicate amenity types or the accessibility toggle
 * (e.g. "wheelchair accessible" when Accessible is already a separate field).
 */
export function isOverlappingFeature(
  feature: FeatureType,
  amenities: AmenityType[]
) {
  const featureKey = normalizeKey(feature.label)
  const featureSlug = normalizeKey(feature.slug)

  if (
    featureKey.includes("wheelchair") ||
    featureKey.includes("accessible") ||
    featureSlug.includes("wheelchair") ||
    featureSlug.includes("accessible")
  ) {
    return true
  }

  return amenities.some((amenity) => {
    const amenityKey = normalizeKey(amenity.label)
    const amenitySlug = normalizeKey(amenity.slug)

    if (featureKey === amenityKey || featureSlug === amenitySlug) return true
    if (amenityKey.includes(featureKey) || featureKey.includes(amenityKey)) {
      return true
    }
    if (amenitySlug.includes(featureSlug) || featureSlug.includes(amenitySlug)) {
      return true
    }
    return false
  })
}
