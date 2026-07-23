"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { upsertProfileRow } from "@/lib/upsert-profile"
import { isSupabaseWriteConfigured } from "@/lib/validation"
import type { Profile, ProfileActivity } from "@/types/profile"

export type ProfileDashboard = {
  profile: Profile
  activity: ProfileActivity
}

/**
 * Upserts the signed-in Clerk user into `profiles` and returns
 * live activity counts (reviews, submissions, approved places).
 */
export async function syncProfileAndGetActivity(): Promise<ProfileDashboard | null> {
  const { userId } = await auth()
  if (!userId || !isSupabaseWriteConfigured()) return null

  const user = await currentUser()
  const supabase = createAdminClient()
  const { userId: profileId, error: upsertError } = await upsertProfileRow(
    supabase,
    userId,
    user
  )

  if (!profileId) {
    console.error("Failed to sync profile:", upsertError)
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, updated_at")
    .eq("id", profileId)
    .single()

  if (profileError || !profile) {
    console.error("Failed to load profile:", profileError?.message)
    return null
  }

  const [reviewsResult, submissionsResult, approvedResult] = await Promise.all([
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("facility_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("facility_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved"),
  ])

  return {
    profile: profile as Profile,
    activity: {
      reviewsWritten: reviewsResult.count ?? 0,
      facilitiesContributed: submissionsResult.count ?? 0,
      placesVerified: approvedResult.count ?? 0,
    },
  }
}
