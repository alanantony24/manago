import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Facility } from "@/types/facility"
import ReviewForm from "./components/review-form"

export const dynamic = "force-dynamic"

type ReviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
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

  const facility = data as Facility

  return (
    <ReviewForm
      facilityId={facility.id}
      facilityName={facility.name}
      facilityPhoto={facility.photo_url ?? "/toilet.jpg"}
    />
  )
}
