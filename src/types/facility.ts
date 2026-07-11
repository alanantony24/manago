export type AmenityType = {
  id: number
  slug: string
  label: string
}

export type Facility = {
  id: string
  external_id: string | null
  name: string
  amenity_type_id: number
  latitude: number
  longitude: number
  address: string | null
  building_name: string | null
  floor: string | null
  description: string | null
  photo_url: string | null
  is_accessible: boolean
  is_verified: boolean
  status: string | null
  created_at: string
  amenity_types: AmenityType | null
}

export type FacilityWithDistance = Facility & {
  distanceKm: number
}
