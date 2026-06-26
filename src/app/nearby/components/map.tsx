"use client"

import { useRef, useEffect } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import type { Facility } from "@/types/facility"

const DEFAULT_CENTER: [number, number] = [103.853, 1.294]
const NEARBY_ZOOM = 15

type MapProps = {
  facilities: Facility[]
  selectedFacilityId?: string | null
  onUserLocation?: (coords: [number, number]) => void
  onFacilitySelect?: (facilityId: string) => void
}

function Map({
  facilities,
  selectedFacilityId,
  onUserLocation,
  onFacilitySelect,
}: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const onUserLocationRef = useRef(onUserLocation)
  const onFacilitySelectRef = useRef(onFacilitySelect)
  const facilityMarkersRef = useRef(
    new globalThis.Map<string, mapboxgl.Marker>()
  )

  onUserLocationRef.current = onUserLocation
  onFacilitySelectRef.current = onFacilitySelect

  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: 12,
    })

    mapRef.current = map

    let userMarker: mapboxgl.Marker | null = null

    const locateUser = () => {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ]

          userMarker?.remove()
          userMarker = new mapboxgl.Marker({ color: "#0891b2" })
            .setLngLat(coords)
            .addTo(map)

          map.flyTo({ center: coords, zoom: NEARBY_ZOOM, essential: true })
          onUserLocationRef.current?.(coords)
        },
        () => {
          map.flyTo({ center: DEFAULT_CENTER, zoom: 12, essential: true })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }

    map.on("load", locateUser)

    return () => {
      userMarker?.remove()
      facilityMarkersRef.current.forEach((marker) => marker.remove())
      facilityMarkersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const syncMarkers = () => {
      const existing = facilityMarkersRef.current
      const nextIds = new Set(facilities.map((f) => f.id))

      existing.forEach((marker, id) => {
        if (!nextIds.has(id)) {
          marker.remove()
          existing.delete(id)
        }
      })

      facilities.forEach((facility) => {
        const coords: [number, number] = [
          facility.longitude,
          facility.latitude,
        ]

        const existingMarker = existing.get(facility.id)
        if (existingMarker) {
          existingMarker.setLngLat(coords)
          return
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<strong>${facility.name}</strong>${facility.address ? `<br/><span style="font-size:12px">${facility.address}</span>` : ""}`
        )

        const marker = new mapboxgl.Marker({ color: "#eab308" })
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map)

        marker.getElement().addEventListener("click", () => {
          onFacilitySelectRef.current?.(facility.id)
        })

        existing.set(facility.id, marker)
      })
    }

    if (map.isStyleLoaded()) {
      syncMarkers()
    } else {
      map.once("load", syncMarkers)
    }
  }, [facilities])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFacilityId) return

    const facility = facilities.find((f) => f.id === selectedFacilityId)
    if (!facility) return

    map.flyTo({
      center: [facility.longitude, facility.latitude],
      zoom: NEARBY_ZOOM,
      essential: true,
    })

    const marker = facilityMarkersRef.current.get(selectedFacilityId)
    marker?.togglePopup()
  }, [selectedFacilityId, facilities])

  return (
    <div
      id="map-container"
      ref={mapContainerRef}
      className="h-64 w-full rounded-md"
    />
  )
}

export default Map
