export type Review = {
  id: string
  facility_id: string
  user_id: string | null
  rating: number
  tags: string[]
  comment: string | null
  is_approved: boolean
  created_at: string
}
