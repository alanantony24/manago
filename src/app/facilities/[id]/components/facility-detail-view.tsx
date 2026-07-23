"use client"

import { Link, useTransitionRouter } from "next-view-transitions"
import {
  AlertTriangle,
  ChevronLeft,
  Star,
  MapPin,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MenuToggle } from "@/components/nav-menu"
import { FacilityTagPill } from "@/components/facility-tag-pill"
import type { AmenityType, Facility } from "@/types/facility"
import type { Review } from "@/types/review"
import { getAggregateRating, formatReviewDate } from "@/lib/reviews"
import {
  formatUpdatedAt,
  getDataQualityWarning,
  getFacilityDataQuality,
  getFacilityLocation,
  getFacilityPhotoUrl,
  getFacilitySummary,
  getFacilityTags,
} from "@/lib/facility-helpers"
import { DeleteReviewButton } from "./delete-review-button"
import { FacilityAdminPanel } from "./facility-admin-panel"

type FacilityDetailViewProps = {
  facility: Facility
  reviews: Review[]
  isAdmin?: boolean
  amenityTypes?: AmenityType[]
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
              ? "fill-manago-orange text-manago-orange"
              : "text-border"
          }`}
        />
      ))}
    </div>
  )
}

export default function FacilityDetailView({
  facility,
  reviews,
  isAdmin = false,
  amenityTypes = [],
}: FacilityDetailViewProps) {
  const router = useTransitionRouter()
  const photo = getFacilityPhotoUrl(facility)
  const typeLabel = facility.amenity_types?.label ?? "Facility"
  const tags = getFacilityTags(facility)
  const location = getFacilityLocation(facility)
  const summary = getFacilitySummary(facility)
  const dataQuality = getFacilityDataQuality(facility)
  const qualityWarning = getDataQualityWarning(dataQuality)
  const navigateUrl = `/locate?facilityId=${facility.id}`
  const reviewHref = `/facilities/${facility.id}/review`
  const { average: averageRating, count: reviewCount } =
    getAggregateRating(reviews)

  return (
    <div className="min-h-full bg-background pb-28 text-foreground">
      <div className="relative h-52 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote facility photo */}
        <img
          src={photo}
          alt={facility.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <MenuToggle
          variant="onLight"
          className="absolute left-4 top-4 z-10"
        />

        <Link
          href="/nearby"
          className="absolute left-[4.25rem] top-4 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-md"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6 text-manago-navy" />
        </Link>

        <span className="absolute right-4 top-4 rounded-full bg-manago-teal px-3 py-1 text-sm font-medium text-white shadow-md">
          {typeLabel}
        </span>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h1 className="text-xl font-bold text-manago-navy">{facility.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{location}</p>

          {qualityWarning && (
            <div
              className={`mt-4 flex gap-3 rounded-xl border p-3 text-sm ${
                dataQuality === "minimal"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-yellow-200 bg-yellow-50 text-yellow-900"
              }`}
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{qualityWarning}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <StarRating rating={averageRating} />
              {reviewCount > 0 ? (
                <>
                  <span className="font-medium text-manago-navy">
                    {averageRating}
                  </span>
                  <span className="text-muted-foreground/70">
                    ({reviewCount})
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground/70">No reviews yet</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-muted-foreground/70" />
              <span>{location}</span>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <FacilityTagPill key={tag}>{tag}</FacilityTagPill>
              ))}
            </div>
          )}

          {summary ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No details yet for this location.
            </p>
          )}

          <p className="mt-4 text-xs text-muted-foreground/70">
            {formatUpdatedAt(facility.created_at)}
          </p>
        </div>

        {isAdmin ? (
          <FacilityAdminPanel
            facility={facility}
            amenityTypes={amenityTypes}
          />
        ) : null}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-manago-navy">Reviews</h2>
            <Link
              href={reviewHref}
              className="text-sm font-medium text-manago-teal hover:text-manago-teal-dark"
            >
              Write one
            </Link>
          </div>

          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
              No reviews yet. Be the first to leave one!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <StarRating rating={review.rating} />
                      {review.profiles?.display_name?.trim() ? (
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                          {review.profiles.display_name.trim()}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/70">
                      {formatReviewDate(review.created_at)}
                    </span>
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

                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}

                  {isAdmin ? (
                    <DeleteReviewButton
                      reviewId={review.id}
                      facilityId={facility.id}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 rounded-xl border-manago-teal text-manago-teal hover:bg-manago-teal/10"
          >
            <Link href={reviewHref}>
              <Star className="size-4" />
              Review
            </Link>
          </Button>
          <Button
            className="h-12 flex-1 rounded-xl bg-manago-teal text-white hover:bg-manago-teal-dark"
            onClick={() => router.push(navigateUrl)}
          >
            <Navigation className="size-4" />
            Navigate
          </Button>
        </div>
      </div>
    </div>
  )
}
