"use client"

import { useTransitionRouter } from "next-view-transitions"
import { MapPin, FileText, Star, Navigation, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  FacilityTagPill,
} from "@/components/facility-tag-pill"
import type { FacilityWithDistance } from "@/types/facility"
import { formatDistance } from "@/lib/geo"
import { getFacilityDataQuality, getFacilityNotes } from "@/lib/facility-helpers"

type FacilityCardProps = {
  facility: FacilityWithDistance
}

export default function FacilityCard({ facility }: FacilityCardProps) {
  const router = useTransitionRouter()
  const tags: string[] = []
  const typeName = facility.amenity_types?.label
  const notes = getFacilityNotes(facility.description)
  const dataQuality = getFacilityDataQuality(facility)

  if (typeName) tags.push(typeName)
  if (facility.is_accessible) tags.push("PWD Friendly")
  if (facility.is_verified) tags.push("Verified")

  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`

  return (
    <article
      className="flex w-full min-w-0 cursor-pointer flex-row gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-manago-teal/40 hover:shadow-md"
      onClick={() => router.push(`/facilities/${facility.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/facilities/${facility.id}`)
        }
      }}
    >
      <img
        className="size-24 shrink-0 rounded-lg object-cover"
        src={facility.photo_url ?? "/toilet.jpg"}
        alt={facility.name}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight text-manago-navy">
            {facility.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {dataQuality !== "complete" && (
              <span
                className="rounded-full bg-amber-50 p-1 text-amber-700"
                title="Limited location data"
              >
                <AlertTriangle className="size-3.5" />
              </span>
            )}
            <span className="rounded-full bg-manago-mint px-2.5 py-0.5 text-xs font-semibold text-manago-teal-dark">
              {formatDistance(facility.distanceKm)}
            </span>
          </div>
        </div>

        {facility.address && (
          <div className="space-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <MapPin className="size-3" />
              Location
            </p>
            <p className="text-sm leading-snug text-gray-700">
              {facility.address}
            </p>
          </div>
        )}

        {notes && (
          <div className="space-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <FileText className="size-3" />
              Details
            </p>
            <p className="line-clamp-2 text-sm leading-snug text-gray-600">
              {notes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < 4
                    ? "fill-manago-orange text-manago-orange"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">No reviews yet</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <FacilityTagPill key={tag}>{tag}</FacilityTagPill>
            ))}
          </div>
        )}

        <Button
          className="h-9 w-full rounded-lg bg-manago-teal text-white hover:bg-manago-teal-dark sm:w-fit sm:px-5"
          onClick={(e) => {
            e.stopPropagation()
            window.open(navigateUrl, "_blank", "noopener,noreferrer")
          }}
        >
          <Navigation className="size-4" />
          Navigate
        </Button>
      </div>
    </article>
  )
}
