"use client"

import { useMemo, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import {
  Search,
  LayoutGrid,
  GlassWater,
  Toilet,
  Baby,
  SlidersHorizontal,
} from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import FacilityCard from "./facility-card"
import { AppPageHeader } from "@/components/app-page-header"
import type { Facility } from "@/types/facility"
import { getDistanceKm } from "@/lib/geo"

const FacilityMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-64 w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-600"
      role="status"
    >
      Loading map…
    </div>
  ),
})

type FilterKey = "all" | "water_cooler" | "toilet_with_bidet" | "nursing_room"

const FILTERS: { key: FilterKey; label: string; icon: ReactNode }[] = [
  { key: "all", label: "All", icon: <LayoutGrid /> },
  { key: "water_cooler", label: "Water Cooler", icon: <GlassWater /> },
  {
    key: "toilet_with_bidet",
    label: "Toilets with Bidets",
    icon: <Toilet />,
  },
  { key: "nursing_room", label: "Nursing Rooms", icon: <Baby /> },
]

type NearbyViewProps = {
  facilities: Facility[]
}

export default function NearbyView({ facilities }: NearbyViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  )

  const filteredFacilities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return facilities
      .filter((facility) => {
        if (activeFilter !== "all") {
          const slug = facility.amenity_types?.slug
          if (slug !== activeFilter) return false
        }

        if (!query) return true

        return (
          facility.name.toLowerCase().includes(query) ||
          facility.address?.toLowerCase().includes(query) ||
          facility.description?.toLowerCase().includes(query)
        )
      })
      .map((facility) => {
        const distanceKm = userLocation
          ? getDistanceKm(
              userLocation[1],
              userLocation[0],
              facility.latitude,
              facility.longitude
            )
          : Infinity

        return { ...facility, distanceKm }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [facilities, activeFilter, searchQuery, userLocation])

  return (
    <div className="w-full max-w-full min-h-screen overflow-x-hidden bg-gray-50 text-manago-navy">
      <AppPageHeader>
        <InputGroup className="h-10 w-full rounded-full border-0 bg-white shadow-sm sm:h-11">
          <InputGroupAddon className="pl-3.5 text-gray-500 sm:pl-4">
            <Search className="size-4 sm:size-[1.125rem]" />
          </InputGroupAddon>
          <InputGroupInput
            className="text-sm text-manago-navy placeholder:text-gray-500 sm:text-base"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </AppPageHeader>

      <div className="flex w-full max-w-full flex-col gap-4 p-4">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex flex-row gap-3">
            {FILTERS.map(({ key, label, icon }) => (
              <Button
                key={key}
                variant="outline"
                size="lg"
                className={
                  activeFilter === key
                    ? "border-manago-teal bg-manago-teal text-white hover:bg-manago-teal-dark hover:text-white"
                    : "border-gray-300 bg-white text-manago-navy hover:bg-gray-50"
                }
                onClick={() => setActiveFilter(key)}
              >
                {icon} {label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <FacilityMap
          facilities={filteredFacilities}
          selectedFacilityId={selectedFacilityId}
          onUserLocation={setUserLocation}
          onFacilitySelect={setSelectedFacilityId}
        />

        <div className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-bold text-manago-navy">Nearby You</h3>
          <Button className="bg-manago-teal text-white hover:bg-manago-teal-dark">
            <SlidersHorizontal /> Sort
          </Button>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4">
          {filteredFacilities.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">
              {facilities.length === 0
                ? "No facilities loaded yet. Seed your Supabase database to see amenities here."
                : "No facilities match your search or filter."}
            </p>
          ) : (
            filteredFacilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
