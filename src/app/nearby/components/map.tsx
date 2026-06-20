"use client"

import { useRef, useEffect } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

const DEFAULT_CENTER: [number, number] = [103.853, 1.294]
const NEARBY_ZOOM = 15

type MapProps = {
  onUserLocation?: (coords: [number, number]) => void
}

function Map({ onUserLocation }: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const onUserLocationRef = useRef(onUserLocation)

  onUserLocationRef.current = onUserLocation

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
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      id="map-container"
      ref={mapContainerRef}
      className="h-64 w-full rounded-md"
    />
  )
}

export default Map
