"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { upsertProfileRow } from "@/lib/upsert-profile"
import type { FacilitySubmission } from "@/types/submission"
import {
  isSupabaseWriteConfigured,
  isValidSingaporeCoordinate,
  isValidTimeString,
  parseFeatureIds,
  readFormBool,
  readFormNumber,
  readFormString,
  validateImageFile,
  LIMITS,
} from "@/lib/validation"

/** Submit a new facility for admin review (authenticated users only). */
export async function submitFacilitySubmission(
  formData: FormData
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { error: "Please sign in to contribute a facility." }
  if (!isSupabaseWriteConfigured()) {
    return {
      error:
        "Database writes are not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    }
  }

  const name = readFormString(formData, "name")
  const amenityTypeId = readFormNumber(formData, "amenityTypeId")
  const latitude = readFormNumber(formData, "latitude")
  const longitude = readFormNumber(formData, "longitude")
  const address = readFormString(formData, "address")
  const buildingName = readFormString(formData, "buildingName")
  const floor = readFormString(formData, "floor")
  const description = readFormString(formData, "description")
  const openTimeRaw = readFormString(formData, "openTime")
  const closeTimeRaw = readFormString(formData, "closeTime")
  const is24Hours = readFormBool(formData, "is24Hours")
  const isAccessible = readFormBool(formData, "isAccessible")
  const featureIds = parseFeatureIds(readFormString(formData, "featureIds"))

  if (!name || name.length > LIMITS.name) {
    return { error: "Facility name is required (max 120 characters)." }
  }
  if (!Number.isInteger(amenityTypeId) || amenityTypeId <= 0) {
    return { error: "Please choose a facility type." }
  }
  if (!address || address.length > LIMITS.address) {
    return { error: "Please pick a valid location." }
  }
  if (!isValidSingaporeCoordinate(latitude, longitude)) {
    return { error: "Location must be within Singapore." }
  }
  if (!floor || floor.length > LIMITS.floor) {
    return { error: "Please enter the floor (max 40 characters)." }
  }
  if (buildingName.length > LIMITS.buildingName) {
    return { error: "Building name is too long." }
  }
  if (description.length > LIMITS.description) {
    return { error: "Notes are too long (max 1000 characters)." }
  }
  if (featureIds === null) {
    return { error: "Invalid feature selection." }
  }

  let openTime: string | null = null
  let closeTime: string | null = null
  if (!is24Hours) {
    if (!isValidTimeString(openTimeRaw) || !isValidTimeString(closeTimeRaw)) {
      return {
        error: "Please set valid opening and closing times, or turn on 24 hours.",
      }
    }
    openTime = openTimeRaw
    closeTime = closeTimeRaw
  }

  const image = formData.get("image")
  if (!(image instanceof File) || image.size <= 0) {
    return { error: "Please upload a photo." }
  }
  const imageError = validateImageFile(image)
  if (imageError) return { error: imageError }

  const user = await currentUser()
  const supabase = createAdminClient()

  const { data: amenity, error: amenityError } = await supabase
    .from("amenity_types")
    .select("id")
    .eq("id", amenityTypeId)
    .maybeSingle()

  if (amenityError) return { error: amenityError.message }
  if (!amenity) return { error: "Please choose a valid facility type." }

  if (featureIds.length > 0) {
    const { data: features, error: featureError } = await supabase
      .from("feature_types")
      .select("id")
      .in("id", featureIds)

    if (featureError) return { error: featureError.message }
    if (!features || features.length !== featureIds.length) {
      return { error: "One or more selected features are invalid." }
    }
  }

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

  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const fileName = `${Date.now()}-${safeName}`
  const bytes = new Uint8Array(await image.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from("addlocation-images")
    .upload(fileName, bytes, {
      contentType: image.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const photoUrl = supabase.storage
    .from("addlocation-images")
    .getPublicUrl(fileName).data.publicUrl

  const { error } = await supabase.from("facility_submissions").insert([
    {
      name,
      amenity_type_id: amenityTypeId,
      latitude,
      longitude,
      address,
      building_name: buildingName || null,
      floor,
      description: description || null,
      photo_url: photoUrl,
      open_time: openTime,
      close_time: closeTime,
      is_24_hours: is24Hours,
      is_accessible: isAccessible,
      feature_ids: featureIds,
      user_id: profileUserId,
      status: "pending",
    },
  ])

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Approve a pending submission by id — loads the row from the DB
 * (never trusts client-sent facility fields) and inserts an active facility.
 */
export async function approveFacilitySubmission(
  submissionId: number
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (!isSupabaseWriteConfigured()) {
    return { error: "Database writes are not configured." }
  }
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return { error: "Invalid submission." }
  }

  const supabase = createAdminClient()

  const { data: submission, error: loadError } = await supabase
    .from("facility_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("status", "pending")
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!submission) return { error: "Submission not found or already reviewed." }

  const row = submission as FacilitySubmission

  // Facilities table has no hours columns; pack them into description.
  const hoursNote = row.is_24_hours
    ? "Hours: Open 24 hours"
    : row.open_time && row.close_time
      ? `Hours: ${row.open_time}–${row.close_time}`
      : null
  const description = [row.description, hoursNote].filter(Boolean).join(" | ") || null

  const { error: insertError } = await supabase.from("facilities").insert({
    name: row.name,
    amenity_type_id: row.amenity_type_id,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    building_name: row.building_name,
    floor: row.floor,
    description,
    photo_url: row.photo_url,
    is_accessible: row.is_accessible,
    is_verified: true,
    status: "active",
  })

  if (insertError) return { error: insertError.message }

  const { error: updateError } = await supabase
    .from("facility_submissions")
    .update({ status: "approved" })
    .eq("id", row.id)
    .eq("status", "pending")

  if (updateError) return { error: updateError.message }
  return { error: null }
}

/** Reject a pending facility submission by id. */
export async function rejectFacilitySubmission(
  id: number
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (!isSupabaseWriteConfigured()) {
    return { error: "Database writes are not configured." }
  }
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Invalid submission." }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("facility_submissions")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: "Submission not found or already reviewed." }
  return { error: null }
}
