"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FacilityWithDistance } from "@/types/facility"
import { formatDistance } from "@/lib/geo"

type FacilityCardProps = {
  facility: FacilityWithDistance
  onSelect?: () => void
}

export default function FacilityCard({ facility, onSelect }: FacilityCardProps) {
  const tags: string[] = []
  const typeName = facility.amenity_types?.label

  if (typeName) tags.push(typeName)
  if (facility.is_accessible) tags.push("PWD Friendly")
  if (facility.is_verified) tags.push("Verified")

  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`

  return (
    <div
      className="flex flex-row gap-4 border-2 border-gray-300 rounded-md p-4 w-full min-w-0 cursor-pointer hover:border-cyan-600 transition-colors"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.()
      }}
    >
      <img
        className="w-24 h-24 rounded-sm shrink-0 object-cover"
        src={facility.photo_url ?? "/toilet.jpg"}
        alt={facility.name}
      />
      <div className="flex flex-col min-w-0 flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg">{facility.name}</h3>
          <span className="text-sm text-gray-500 shrink-0">
            {formatDistance(facility.distanceKm)}
          </span>
        </div>

        {facility.address && (
          <p className="text-sm text-gray-600 truncate">{facility.address}</p>
        )}

        {facility.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{facility.description}</p>
        )}

        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">—</span>
          <span className="text-sm text-gray-500">(no reviews yet)</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                className="bg-emerald-700 rounded-full text-white shrink-0 pointer-events-none"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}

        <Button
          className="w-fit"
          onClick={(e) => {
            e.stopPropagation()
            window.open(navigateUrl, "_blank", "noopener,noreferrer")
          }}
        >
          Navigate
        </Button>
      </div>
    </div>
  )
}
