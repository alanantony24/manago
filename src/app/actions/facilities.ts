"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isSupabaseWriteConfigured,
  isValidSingaporeCoordinate,
  isValidUuid,
  LIMITS,
  readFormBool,
  readFormNumber,
  readFormString,
  validateImageFile,
} from "@/lib/validation"

/** Update an existing facility (admin only). Photo is optional. */
export async function updateFacility(
  facilityId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (!isSupabaseWriteConfigured()) {
    return { error: "Database writes are not configured." }
  }
  if (!isValidUuid(facilityId)) {
    return { error: "Invalid facility." }
  }

  const name = readFormString(formData, "name")
  const amenityTypeId = readFormNumber(formData, "amenityTypeId")
  const latitude = readFormNumber(formData, "latitude")
  const longitude = readFormNumber(formData, "longitude")
  const address = readFormString(formData, "address")
  const buildingName = readFormString(formData, "buildingName")
  const floor = readFormString(formData, "floor")
  const description = readFormString(formData, "description")
  const isAccessible = readFormBool(formData, "isAccessible")

  if (!name || name.length > LIMITS.name) {
    return { error: "Facility name is required (max 120 characters)." }
  }
  if (!Number.isInteger(amenityTypeId) || amenityTypeId <= 0) {
    return { error: "Please choose a facility type." }
  }
  if (!address || address.length > LIMITS.address) {
    return { error: "Address is required." }
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
    return { error: "Description is too long (max 1000 characters)." }
  }

  const supabase = createAdminClient()

  const { data: existing, error: loadError } = await supabase
    .from("facilities")
    .select("id, photo_url")
    .eq("id", facilityId)
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!existing) return { error: "Facility not found." }

  const { data: amenity, error: amenityError } = await supabase
    .from("amenity_types")
    .select("id")
    .eq("id", amenityTypeId)
    .maybeSingle()

  if (amenityError) return { error: amenityError.message }
  if (!amenity) return { error: "Please choose a valid facility type." }

  let photoUrl: string | null = existing.photo_url ?? null
  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    const imageError = validateImageFile(image)
    if (imageError) return { error: imageError }

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

    photoUrl = supabase.storage
      .from("addlocation-images")
      .getPublicUrl(fileName).data.publicUrl
  }

  const { error: updateError } = await supabase
    .from("facilities")
    .update({
      name,
      amenity_type_id: amenityTypeId,
      latitude,
      longitude,
      address,
      building_name: buildingName || null,
      floor,
      description: description || null,
      photo_url: photoUrl,
      is_accessible: isAccessible,
    })
    .eq("id", facilityId)

  if (updateError) return { error: updateError.message }

  revalidatePath("/nearby")
  revalidatePath(`/facilities/${facilityId}`)
  return { error: null }
}

/** Hard-delete a facility and its reviews (admin only). */
export async function deleteFacility(
  facilityId: string
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (!isSupabaseWriteConfigured()) {
    return { error: "Database writes are not configured." }
  }
  if (!isValidUuid(facilityId)) {
    return { error: "Invalid facility." }
  }

  const supabase = createAdminClient()

  const { data: existing, error: loadError } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", facilityId)
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!existing) return { error: "Facility not found." }

  const { error: reviewsError } = await supabase
    .from("reviews")
    .delete()
    .eq("facility_id", facilityId)

  if (reviewsError) return { error: reviewsError.message }

  const { error: deleteError } = await supabase
    .from("facilities")
    .delete()
    .eq("id", facilityId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath("/nearby")
  revalidatePath(`/facilities/${facilityId}`)
  return { error: null }
}
