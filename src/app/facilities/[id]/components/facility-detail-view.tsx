"use client"

import { Link } from "next-view-transitions"
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
import type { Facility } from "@/types/facility"
import {
  formatUpdatedAt,
  getDataQualityWarning,
  getFacilityDataQuality,
  getFacilityLocation,
  getFacilitySummary,
  getFacilityTags,
} from "@/lib/facility-helpers"

type FacilityDetailViewProps = {
  facility: Facility
}

export default function FacilityDetailView({ facility }: FacilityDetailViewProps) {
  const photo = facility.photo_url ?? "/toilet.jpg"
  const typeLabel = facility.amenity_types?.label ?? "Facility"
  const tags = getFacilityTags(facility)
  const location = getFacilityLocation(facility)
  const summary = getFacilitySummary(facility)
  const dataQuality = getFacilityDataQuality(facility)
  const qualityWarning = getDataQualityWarning(dataQuality)
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

        <MenuToggle
          variant="onLight"
          className="absolute left-4 top-4 z-10"
        />

        <Link
          href="/nearby"
          className="absolute left-[4.25rem] top-4 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-md"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6 text-gray-800" />
        </Link>

        <span className="absolute right-4 top-4 rounded-full bg-manago-teal px-3 py-1 text-sm font-medium text-white shadow-md">
          {typeLabel}
        </span>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{facility.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{location}</p>

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

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 text-gray-300" />
              <span>No reviews yet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-gray-400" />
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
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              {summary}
            </p>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              No details yet for this location.
            </p>
          )}

          <p className="mt-4 text-xs text-gray-400">
            {facility.is_verified ? "Verified" : "Unverified"} •{" "}
            {formatUpdatedAt(facility.created_at)}
          </p>
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              Reviews are coming soon
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Community reviews will appear here once the reviews feature is
              ready. For now, use Navigate to visit the location.
            </p>
            <Link
              href="/review"
              className="mt-4 inline-flex text-sm font-medium text-manago-teal hover:text-manago-teal-dark"
            >
              Learn more on the Review page
            </Link>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl border-gray-300 text-gray-500"
            disabled
            title="Reviews are coming soon"
          >
            <Star className="size-4" />
            Review soon
          </Button>
          <Button
            className="h-12 flex-1 rounded-xl bg-manago-teal text-white hover:bg-manago-teal-dark"
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
