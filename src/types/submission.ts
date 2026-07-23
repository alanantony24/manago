/** Row shape for pending facility submissions shown in admin. */
export type FacilitySubmission = {
  id: number
  name: string
  amenity_type_id: number
  address: string
  building_name: string | null
  floor: string | null
  description: string | null
  photo_url: string | null
  latitude: number
  longitude: number
  open_time: string | null
  close_time: string | null
  is_24_hours: boolean
  is_accessible: boolean
  feature_ids: number[]
  status: string
}
