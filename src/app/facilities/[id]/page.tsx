import { notFound } from "next/navigation"
import { isAdminUser } from "@/lib/admin"
import { getCurrentUserSafe } from "@/lib/clerk-server"
import { createClient } from "@/lib/supabase/server"
import type { AmenityType, Facility } from "@/types/facility"
import type { Review } from "@/types/review"
import FacilityDetailView from "./components/facility-detail-view"

export const dynamic = "force-dynamic"

type FacilityPageProps = {
  params: Promise<{ id: string }>
}

export default async function FacilityPage({ params }: FacilityPageProps) {
  const { id } = await params

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    notFound()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facilities")
    .select("*, amenity_types(id, slug, label)")
    .eq("id", id)
    .single()

  if (error || !data) {
    notFound()
  }

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, profiles(display_name)")
    .eq("facility_id", id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  const user = await getCurrentUserSafe()
  const isAdmin = isAdminUser(user)

  let amenityTypes: AmenityType[] = []
  if (isAdmin) {
    const { data: amenityData } = await supabase
      .from("amenity_types")
      .select("id, slug, label")
      .order("label")
    amenityTypes = (amenityData ?? []) as AmenityType[]
  }

  return (
    <FacilityDetailView
      facility={data as Facility}
      reviews={(reviewsData ?? []) as Review[]}
      isAdmin={isAdmin}
      amenityTypes={amenityTypes}
    />
  )
}
