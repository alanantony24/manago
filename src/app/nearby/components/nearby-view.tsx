"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  MapPin,
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
import Map from "./map"
import FacilityCard from "./facility-card"
import type { Facility } from "@/types/facility"
import { getDistanceKm } from "@/lib/geo"

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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="w-full bg-cyan-600 flex flex-col items-center justify-center gap-4 rounded-b-2xl py-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-10 h-10 text-yellow-500" />
          <h1 className="text-white text-2xl font-bold">ManaGo!</h1>
        </div>

        <InputGroup className="max-w-xs bg-white">
          <InputGroupInput
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col w-full max-w-full gap-4 p-4">
        <ScrollArea className="w-full rounded-md whitespace-nowrap">
          <div className="flex flex-row gap-3">
            {FILTERS.map(({ key, label, icon }) => (
              <Button
                key={key}
                variant="outline"
                size="lg"
                className={
                  activeFilter === key
                    ? "bg-cyan-600 text-white border-cyan-600"
                    : undefined
                }
                onClick={() => setActiveFilter(key)}
              >
                {icon} {label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Map
          facilities={filteredFacilities}
          selectedFacilityId={selectedFacilityId}
          onUserLocation={setUserLocation}
          onFacilitySelect={setSelectedFacilityId}
        />

        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold">Nearby You</h3>
          <Button variant="outline" className="bg-cyan-600 text-white">
            <SlidersHorizontal /> Sort
          </Button>
        </div>

        <div className="flex flex-col gap-4 w-full min-w-0">
          {filteredFacilities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
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
