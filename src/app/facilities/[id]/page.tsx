import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Facility } from "@/types/facility"
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

  return <FacilityDetailView facility={data as Facility} />
}
