"use client"

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import dynamic from "next/dynamic"
import {
  Search,
  LayoutGrid,
  GlassWater,
  Toilet,
  Baby,
  Shapes,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
} from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FacilityCard from "./facility-card"
import { AppPageHeader } from "@/components/app-page-header"
import type { Facility, FacilityRatingSummary } from "@/types/facility"
import { isPrimaryAmenitySlug } from "@/lib/amenity"
import { getDistanceKm } from "@/lib/geo"

const PAGE_SIZE = 20

const FacilityMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-64 w-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground"
      role="status"
    >
      Loading map…
    </div>
  ),
})

type FilterKey =
  | "all"
  | "water_cooler"
  | "toilet_with_bidet"
  | "nursing_room"
  | "others"

const FILTERS: { key: FilterKey; label: string; icon: ReactNode }[] = [
  { key: "all", label: "All", icon: <LayoutGrid /> },
  { key: "water_cooler", label: "Water Cooler", icon: <GlassWater /> },
  {
    key: "toilet_with_bidet",
    label: "Toilets with Bidets",
    icon: <Toilet />,
  },
  { key: "nursing_room", label: "Nursing Rooms", icon: <Baby /> },
  { key: "others", label: "Others", icon: <Shapes /> },
]

type NearbyViewProps = {
  facilities: Facility[]
  ratingsByFacilityId: Record<string, FacilityRatingSummary>
}

export default function NearbyView({
  facilities,
  ratingsByFacilityId,
}: NearbyViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const listTopRef = useRef<HTMLDivElement>(null)

  const filteredFacilities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return facilities
      .filter((facility) => {
        const slug = facility.amenity_types?.slug

        if (activeFilter === "others") {
          if (isPrimaryAmenitySlug(slug)) return false
        } else if (activeFilter !== "all") {
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
        const rating = ratingsByFacilityId[facility.id]

        return {
          ...facility,
          distanceKm,
          averageRating: rating?.averageRating ?? 0,
          reviewCount: rating?.reviewCount ?? 0,
        }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [facilities, ratingsByFacilityId, activeFilter, searchQuery, userLocation])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFacilities.length / PAGE_SIZE)
  )
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageEnd = Math.min(
    pageStart + PAGE_SIZE,
    filteredFacilities.length
  )
  const pagedFacilities = filteredFacilities.slice(pageStart, pageEnd)

  /** Jump to a page and keep the page input in sync. */
  function goToPage(page: number) {
    const next = Math.min(Math.max(1, page), totalPages)
    setCurrentPage(next)
    setPageInput(String(next))
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  /** Reset to page 1 when the filter or search changes. */
  function resetToFirstPage() {
    setCurrentPage(1)
    setPageInput("1")
  }

  /** Apply a typed page number from the jump form. */
  function handleJumpToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Number.parseInt(pageInput, 10)
    if (Number.isNaN(parsed)) {
      setPageInput(String(safePage))
      return
    }
    goToPage(parsed)
  }

  return (
    <div className="w-full max-w-full min-h-screen overflow-x-hidden bg-background text-foreground">
      <AppPageHeader>
        <InputGroup className="h-10 w-full rounded-full border-0 bg-white shadow-sm sm:h-11">
          <InputGroupAddon className="pl-3.5 text-muted-foreground sm:pl-4">
            <Search className="size-4 sm:size-[1.125rem]" />
          </InputGroupAddon>
          <InputGroupInput
            className="text-sm text-manago-navy placeholder:text-muted-foreground sm:text-base"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              resetToFirstPage()
            }}
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
                    : "border-border bg-white text-manago-navy hover:bg-muted"
                }
                onClick={() => {
                  setActiveFilter(key)
                  resetToFirstPage()
                }}
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

        <h3 className="text-lg font-bold text-manago-navy">Nearby You</h3>

        {!userLocation && (
          <p className="text-xs text-muted-foreground">
            Allow location access to sort by distance. Until then, results keep
            the database order.
          </p>
        )}

        <div ref={listTopRef} className="flex w-full min-w-0 flex-col gap-4">
          {filteredFacilities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {facilities.length === 0
                ? "No facilities loaded yet. Seed your Supabase database to see amenities here."
                : "No facilities match your search or filter."}
            </p>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground">
                Showing {pageStart + 1}–{pageEnd} of {filteredFacilities.length}
              </p>

              {pagedFacilities.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}

              {totalPages > 1 && (
                <nav
                  aria-label="Facility list pages"
                  className="flex w-full items-center justify-center border-t border-border pt-4"
                >
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-border bg-white text-manago-navy hover:bg-muted"
                      disabled={safePage <= 1}
                      onClick={() => goToPage(1)}
                      aria-label="Go to first page"
                    >
                      <ChevronsLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-border bg-white text-manago-navy hover:bg-muted"
                      disabled={safePage <= 1}
                      onClick={() => goToPage(safePage - 1)}
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft />
                    </Button>

                    <form
                      onSubmit={handleJumpToPage}
                      className="mx-1 flex items-center gap-1.5 text-sm text-manago-navy"
                    >
                      <label htmlFor="nearby-page-jump" className="sr-only">
                        Page number
                      </label>
                      <Input
                        id="nearby-page-jump"
                        type="number"
                        min={1}
                        max={totalPages}
                        inputMode="numeric"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={() => {
                          const parsed = Number.parseInt(pageInput, 10)
                          if (Number.isNaN(parsed)) {
                            setPageInput(String(safePage))
                            return
                          }
                          goToPage(parsed)
                        }}
                        className="h-7 w-12 border-border bg-white px-1 text-center tabular-nums text-manago-navy [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label={`Page number, 1 to ${totalPages}`}
                      />
                      <span className="whitespace-nowrap text-muted-foreground">
                        of {totalPages}
                      </span>
                    </form>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-border bg-white text-manago-navy hover:bg-muted"
                      disabled={safePage >= totalPages}
                      onClick={() => goToPage(safePage + 1)}
                      aria-label="Go to next page"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
