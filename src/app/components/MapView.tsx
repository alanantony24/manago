'use client'; // on browser 

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl'; // MapBox library
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  userLocation: [number, number] | null; // null if no location yet
  onRouteInfo?: (info: { direction: string; time: string; distance: string }) => void;
}

// Test destination: Raffles City B1 Toilet
const TEST_AMENITY: [number, number] = [103.8529, 1.2933];

export default function MapView({ userLocation, onRouteInfo }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !userLocation) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === 'your_token_here') return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userLocation,
      zoom: 14,
    });

    map.current.on('load', async () => {
      if (!map.current) return;

      // User location marker (blue)
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setText('You are here'))
        .addTo(map.current);

      // Amenity marker (teal)
      new mapboxgl.Marker({ color: '#0D9488' })
        .setLngLat(TEST_AMENITY)
        .setPopup(new mapboxgl.Popup().setText('Raffles City B1 Toilet'))
        .addTo(map.current);

      // Fetch route from Mapbox Directions API
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${TEST_AMENITY[0]},${TEST_AMENITY[1]}?steps=true&geometries=geojson&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      // if cannot find a route, stop 
      if (!data.routes || data.routes.length === 0) return;

      // choose the first route 
      const route = data.routes[0];
      const coords = route.geometry;

      // Draw route line on map
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: coords },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#0D9488', 'line-width': 5 },
      });

      // Fit map to show full route
      const coordinates = coords.coordinates;
      const bounds = coordinates.reduce(
        (b: mapboxgl.LngLatBounds, coord: [number, number]) => b.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );
      map.current.fitBounds(bounds, { padding: 60 });

      // Send route info to parent (page.tsx)
      if (onRouteInfo) {
        const duration = Math.ceil(route.duration / 60);
        const distance = route.distance < 1000
          ? `${Math.round(route.distance)}m`
          : `${(route.distance / 1000).toFixed(1)}km`;
        const firstStep = route.legs[0].steps[0].maneuver.instruction;
        onRouteInfo({ direction: firstStep, time: `${duration}min`, distance });
      }
    });

    return () => map.current?.remove();
  }, [userLocation]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
