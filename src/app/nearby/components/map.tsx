"use client"

import { useRef, useEffect } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MANAGO_BRAND_ORANGE, MANAGO_TEAL } from "@/lib/brand-colors"
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
  onUserLocationRef.current = onUserLocation
  onFacilitySelectRef.current = onFacilitySelect

  // Create the map once, then try to center it on the user's location.
  useEffect(() => {
    if (!containerRef.current) return

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
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
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

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        facility.address
          ? `<strong>${facility.name}</strong><br/><span style="font-size:12px">${facility.address}</span>`
          : `<strong>${facility.name}</strong>`
      )

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

  // When a facility is picked from the list, fly to it and open its popup.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFacilityId) return

    const facility = facilities.find((f) => f.id === selectedFacilityId)
    if (!facility) return

    map.flyTo({
      center: [facility.longitude, facility.latitude],
      zoom: NEARBY_ZOOM,
    })
    markersRef.current.get(selectedFacilityId)?.togglePopup()
  }, [selectedFacilityId, facilities])

  return <div ref={containerRef} className="h-64 w-full rounded-md" />
}
