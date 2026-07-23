"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { upsertProfileRow } from "@/lib/upsert-profile"
import {
  isSupabaseWriteConfigured,
  isValidUuid,
  sanitizeComment,
  sanitizeReviewTags,
} from "@/lib/validation"

export type SubmitReviewInput = {
  facilityId: string
  rating: number
  tags: string[]
  comment: string | null
}

/** Insert an approved review for a facility (authenticated users only). */
export async function submitReview(
  input: SubmitReviewInput
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { error: "Please sign in to submit a review." }
  if (!isSupabaseWriteConfigured()) return { error: "Database is not configured." }

  if (!isValidUuid(input.facilityId)) {
    return { error: "Invalid facility." }
  }

  const rating = Number(input.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please select a rating between 1 and 5." }
  }

  const tags = sanitizeReviewTags(input.tags)
  const comment = sanitizeComment(input.comment)

  const user = await currentUser()
  const supabase = createAdminClient()

  const { data: facility, error: facilityError } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", input.facilityId)
    .maybeSingle()

  if (facilityError) return { error: facilityError.message }
  if (!facility) return { error: "Facility not found." }

  const { userId: profileUserId, error: profileError } = await upsertProfileRow(
    supabase,
    userId,
    user
  )
  if (!profileUserId) {
    return {
      error: profileError ?? "Could not save your profile. Please try again.",
    }
  }

  const { error: insertError } = await supabase.from("reviews").insert([
    {
      facility_id: input.facilityId,
      user_id: profileUserId,
      rating,
      tags,
      comment,
      is_approved: true,
    },
  ])

  if (insertError) return { error: insertError.message }

  revalidatePath("/nearby")
  revalidatePath(`/facilities/${input.facilityId}`)
  return { error: null }
}

/** Hard-delete a review (admin only). */
export async function deleteReview(
  reviewId: string,
  facilityId: string
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (!isSupabaseWriteConfigured()) {
    return { error: "Database writes are not configured." }
  }
  if (!isValidUuid(reviewId) || !isValidUuid(facilityId)) {
    return { error: "Invalid review." }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("facility_id", facilityId)
    .select("id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: "Review not found." }

  revalidatePath("/nearby")
  revalidatePath(`/facilities/${facilityId}`)
  return { error: null }
}
