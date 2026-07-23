import type { Review } from "@/types/review"

/** Allowed review tag labels shown in the review form. */
export const REVIEW_TAGS = [
  "Clean",
  "Well-stocked",
  "Accessible",
  "24 Hours",
  "Needs Cleaning",
  "Malfunction",
  "Crowded",
  "Out of Stock",
] as const

/** Short labels for 1–5 star ratings. */
export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
}

/** Average rating across a list of reviews (one decimal place). */
export function getAggregateRating(reviews: Review[]): {
  average: number
  count: number
} {
  if (reviews.length === 0) return { average: 0, count: 0 }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

/** Aggregate approved review rows into per-facility averages. */
export function getRatingsByFacilityId(
  rows: { facility_id: string; rating: number }[]
): Map<string, { average: number; count: number }> {
  const buckets = new Map<string, { total: number; count: number }>()

  for (const row of rows) {
    const bucket = buckets.get(row.facility_id) ?? { total: 0, count: 0 }
    bucket.total += row.rating
    bucket.count += 1
    buckets.set(row.facility_id, bucket)
  }

  const ratings = new Map<string, { average: number; count: number }>()
  for (const [facilityId, { total, count }] of buckets) {
    ratings.set(facilityId, {
      average: Math.round((total / count) * 10) / 10,
      count,
    })
  }
  return ratings
}

/** Relative date string for a review timestamp (e.g. "3 days ago"). */
export function formatReviewDate(dateString: string): string {
  const reviewed = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) return "1 week ago"
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths <= 1) return "1 month ago"
  return `${diffMonths} months ago`
}
