"use client"

import { Link } from "next-view-transitions"
import {
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FacilityTagPill } from "@/components/facility-tag-pill"
import type { Facility } from "@/types/facility"
import {
  MOCK_RATING,
  MOCK_REVIEW_COUNT,
  MOCK_UPVOTES,
  MOCK_REVIEWS,
} from "@/lib/mock-reviews"
import {
  formatUpdatedAt,
  getFacilityLocation,
  getFacilitySummary,
  getFacilityTags,
} from "@/lib/facility-helpers"

type FacilityDetailViewProps = {
  facility: Facility
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number
  size?: "sm" | "md"
}) {
  const starSize = size === "md" ? "w-5 h-5" : "w-4 h-4"

  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default function FacilityDetailView({ facility }: FacilityDetailViewProps) {
  const photo = facility.photo_url ?? "/toilet.jpg"
  const typeLabel = facility.amenity_types?.label ?? "Facility"
  const tags = getFacilityTags(facility)
  const location = getFacilityLocation(facility)
  const summary = getFacilitySummary(facility)
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      <div className="relative h-52 w-full">
        <img
          src={photo}
          alt={facility.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <Link
          href="/nearby"
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-md"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6 text-gray-800" />
        </Link>

        <span className="absolute right-4 top-4 rounded-full bg-cyan-600 px-3 py-1 text-sm font-medium text-white shadow-md">
          {typeLabel}
        </span>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{facility.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{location}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <StarRating rating={MOCK_RATING} />
              <span className="font-medium text-gray-900">{MOCK_RATING}</span>
              <span className="text-gray-400">({MOCK_REVIEW_COUNT})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-gray-400" />
              <span>24 Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-gray-400" />
              <span>Nearby</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <FacilityTagPill key={tag}>{tag}</FacilityTagPill>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{summary}</p>

          <p className="mt-4 text-xs text-gray-400">
            {facility.is_verified ? "Verified" : "Unverified"} • {MOCK_UPVOTES}{" "}
            upvotes • {formatUpdatedAt(facility.created_at)}
          </p>
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
            <button
              type="button"
              className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
            >
              Write one
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${review.avatarColor}`}
                  >
                    {review.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {review.author}
                      </p>
                      <span className="shrink-0 text-xs text-gray-400">
                        {review.date}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                </div>

                {review.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.tags.map((tag) => (
                      <FacilityTagPill key={tag} className="text-[11px]">
                        {tag}
                      </FacilityTagPill>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {review.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl border-cyan-600 text-cyan-600 hover:bg-cyan-50"
          >
            <Star className="size-4" />
            Review
          </Button>
          <Button
            className="h-12 flex-1 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700"
            onClick={() =>
              window.open(navigateUrl, "_blank", "noopener,noreferrer")
            }
          >
            <Navigation className="size-4" />
            Navigate
          </Button>
        </div>
      </div>
    </div>
  )
}
