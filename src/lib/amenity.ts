/** Amenity types the Nearby filters highlight as first-class categories. */
export const PRIMARY_AMENITY_SLUGS = [
  "toilet_with_bidet",
  "water_cooler",
  "nursing_room",
] as const

export type PrimaryAmenitySlug = (typeof PRIMARY_AMENITY_SLUGS)[number]

/** True when the slug is one of Manago's three focus amenity types. */
export function isPrimaryAmenitySlug(
  slug: string | null | undefined
): slug is PrimaryAmenitySlug {
  return (
    slug != null &&
    (PRIMARY_AMENITY_SLUGS as readonly string[]).includes(slug)
  )
}
