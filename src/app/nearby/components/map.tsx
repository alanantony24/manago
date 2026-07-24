"use client"

import { useRef, useEffect } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MANAGO_BRAND_ORANGE, MANAGO_TEAL } from "@/lib/brand-colors"
import { getFacilityLocation } from "@/lib/facility-helpers"
import type { Facility } from "@/types/facility"

// Singapore city center. Used until we know where the user actually is.
const DEFAULT_CENTER: [number, number] = [103.853, 1.294]
const NEARBY_ZOOM = 15

type MapProps = {
  facilities: Facility[]
  selectedFacilityId?: string | null
  onUserLocation?: (coords: [number, number]) => void
  onFacilitySelect?: (facilityId: string) => void
}

export default function FacilityMap({
  facilities,
  selectedFacilityId,
  onUserLocation,
  onFacilitySelect,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef(new Map<string, mapboxgl.Marker>())

  // Keep the latest callbacks in refs so the "create map" effect can run once
  // without re-subscribing every time a parent re-renders.
  const onUserLocationRef = useRef(onUserLocation)
  const onFacilitySelectRef = useRef(onFacilitySelect)

  // Create the map once, then try to center it on the user's location.
  useEffect(() => {
    onUserLocationRef.current = onUserLocation
    onFacilitySelectRef.current = onFacilitySelect
  }, [onUserLocation, onFacilitySelect])

  useEffect(() => {
    if (!containerRef.current) return

    const markers = markersRef.current
    // Flips to true once this effect's cleanup runs (unmount, or a fast
    // remount under Strict Mode). Guards against the async geolocation
    // callback trying to touch a map that's already been torn down.
    let cancelled = false

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: 12,
    })
    mapRef.current = map

    map.on("load", () => {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return

          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ]

          new mapboxgl.Marker({ color: MANAGO_TEAL }).setLngLat(coords).addTo(map)
          map.flyTo({ center: coords, zoom: NEARBY_ZOOM })
          onUserLocationRef.current?.(coords)
        },
        () => {
          // Location denied or unavailable: stay on the default center.
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })

    return () => {
      cancelled = true
      map.remove()
      mapRef.current = null
      markers.clear()
    }
  }, [])

  // Keep the markers on the map in sync with the current facility list.
  // We add markers for new facilities and remove ones that dropped out of the
  // list, instead of rebuilding all of them on every change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers = markersRef.current
    const visibleIds = new Set(facilities.map((f) => f.id))

    for (const [id, marker] of markers) {
      if (!visibleIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }

    for (const facility of facilities) {
      if (markers.has(facility.id)) continue

      const popupContent = document.createElement("div")
      popupContent.className = "flex max-w-[220px] flex-col gap-2"

      const header = document.createElement("div")
      header.className = "flex items-start justify-between gap-2"

      const popupName = document.createElement("strong")
      popupName.className = "min-w-0 flex-1 text-sm leading-snug text-manago-navy"
      popupName.textContent = facility.name

      const closeButton = document.createElement("button")
      closeButton.type = "button"
      closeButton.setAttribute("aria-label", "Close")
      closeButton.className =
        "inline-flex shrink-0 items-center justify-center p-0 text-base leading-none text-muted-foreground hover:text-manago-navy"
      closeButton.textContent = "×"

      header.append(popupName, closeButton)
      popupContent.append(header)

      const popupLocation = document.createElement("p")
      popupLocation.className = "text-xs leading-snug text-muted-foreground"
      popupLocation.textContent = getFacilityLocation(facility)
      popupContent.append(popupLocation)

      const navigateLink = document.createElement("a")
      navigateLink.href = `/locate?facilityId=${facility.id}`
      navigateLink.className =
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-manago-teal px-3 text-xs font-medium text-white no-underline outline-none hover:bg-manago-teal-dark focus-visible:ring-2 focus-visible:ring-manago-teal/40"
      navigateLink.textContent = "Navigate"
      navigateLink.addEventListener("click", (event) => {
        // Keep Mapbox from treating the click as a map/popup dismiss.
        event.stopPropagation()
      })
      popupContent.append(navigateLink)

      // Custom close control above — Mapbox's default × sits cramped in the corner.
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setDOMContent(
        popupContent
      )

      closeButton.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        popup.remove()
      })

      const marker = new mapboxgl.Marker({ color: MANAGO_BRAND_ORANGE })
        .setLngLat([facility.longitude, facility.latitude])
        .setPopup(popup)
        .addTo(map)

      marker.getElement().addEventListener("click", () => {
        onFacilitySelectRef.current?.(facility.id)
      })

      markers.set(facility.id, marker)
    }
  }, [facilities])

  // When a facility is selected (list or pin), fly to it and ensure its popup is open.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFacilityId) return

    const facility = facilities.find((f) => f.id === selectedFacilityId)
    if (!facility) return

    map.flyTo({
      center: [facility.longitude, facility.latitude],
      zoom: NEARBY_ZOOM,
    })

    const marker = markersRef.current.get(selectedFacilityId)
    const popup = marker?.getPopup()
    // Pin clicks already open the popup via Mapbox; only open if closed so we
    // don't toggle it shut again on the same selection.
    if (marker && popup && !popup.isOpen()) {
      marker.togglePopup()
    }
  }, [selectedFacilityId, facilities])

  return <div ref={containerRef} className="h-64 w-full rounded-md" />
}
