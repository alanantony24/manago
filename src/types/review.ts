export type Review = {
  id: string
  facility_id: string
  rating: number
  tags: string[]
  comment: string | null
  is_approved: boolean
  created_at: string
}
