import NearbyView from "./components/nearby-view"
import { createClient } from "@/lib/supabase/server"
import { getRatingsByFacilityId } from "@/lib/reviews"
import type { Facility, FacilityRatingSummary } from "@/types/facility"

export const dynamic = "force-dynamic"

export default async function Nearby() {
  let facilities: Facility[] = []
  const ratingsByFacilityId: Record<string, FacilityRatingSummary> = {}

  // fetching the facility details from the database
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient()
    const [{ data, error }, { data: reviewRows, error: reviewError }] =
      await Promise.all([
        supabase
          .from("facilities")
          .select(
            "id, name, latitude, longitude, address, building_name, floor, description, photo_url, is_accessible, amenity_types(id, slug, label)"
          ),
        supabase
          .from("reviews")
          .select("facility_id, rating")
          .eq("is_approved", true),
      ])

    if (error) {
      console.error("Failed to load facilities:", error.message)
    } else if (data) {
      facilities = data as unknown as Facility[] // Supabase types are not generated yet.
    }

    if (reviewError) {
      console.error("Failed to load review ratings:", reviewError.message)
    } else if (reviewRows) {
      for (const [facilityId, summary] of getRatingsByFacilityId(reviewRows)) {
        ratingsByFacilityId[facilityId] = {
          averageRating: summary.average,
          reviewCount: summary.count,
        }
      }
    }
  }

  return (
    <NearbyView
      facilities={facilities}
      ratingsByFacilityId={ratingsByFacilityId}
    />
  )
}
