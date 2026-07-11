import NearbyView from "./components/nearby-view"
import { createClient } from "@/lib/supabase/server"
import type { Facility } from "@/types/facility"

export const dynamic = "force-dynamic"

export default async function Nearby() {
  let facilities: Facility[] = []

  // fetching the facility details from the database
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("facilities")
      .select("*, amenity_types(id, slug, label)")

    if (error) {
      console.error("Failed to load facilities:", error.message)
    } else if (data) {
      facilities = data as Facility[] //store data as a list of facilities
    }
  }

  return <NearbyView facilities={facilities} />
}
