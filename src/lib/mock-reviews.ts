export type MockReview = {
  id: string
  initials: string
  author: string
  date: string
  rating: number
  tags: string[]
  body: string
  avatarColor: string
}

export const MOCK_RATING = 4.2
export const MOCK_REVIEW_COUNT = 57
export const MOCK_UPVOTES = 42

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "1",
    initials: "ST",
    author: "Sarah T.",
    date: "10 Jun 2026",
    rating: 5,
    tags: ["Clean", "Bidet", "Accessible"],
    body: "Very clean and well-maintained. Bidet works perfectly. Accessible cubicle is spacious.",
    avatarColor: "bg-cyan-600",
  },
  {
    id: "2",
    initials: "ML",
    author: "Marcus L.",
    date: "6 Jun 2026",
    rating: 2,
    tags: ["Needs clean"],
    body: "Could use a bit more attention. Tissue was running low when I visited.",
    avatarColor: "bg-gray-400",
  },
  {
    id: "3",
    initials: "PK",
    author: "Priya K.",
    date: "1 Jun 2026",
    rating: 4,
    tags: ["Clean", "Accessible"],
    body: "Great bidet facilities. Easy to find and wheelchair-friendly entrance nearby.",
    avatarColor: "bg-rose-400",
  },
]
