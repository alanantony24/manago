'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  userLocation: [number, number] | null;
  destination: [number, number] | null;
  destinationName?: string;
  onRouteInfo?: (info: { direction: string; time: string; distance: string }) => void;
}

const REROUTE_THRESHOLD_M = 15;

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapView({ userLocation, destination, destinationName, onRouteInfo }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const onRouteInfoRef = useRef(onRouteInfo);
  const lastFetchedAt = useRef<[number, number] | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo;
  }, [onRouteInfo]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [103.8198, 1.3521], // Singapore default
      zoom: 14,
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current || !userLocation || !destination) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    // Always move the marker and recenter, even if we skip refetching the route
    if (userMarker.current) {
      userMarker.current.setLngLat(userLocation);
    } else {
      userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setText('You are here'))
        .addTo(map.current);
    }
    map.current.easeTo({ center: userLocation, duration: 500 });

    // Skip refetching the route if the user hasn't moved far enough
    const [lastLng, lastLat] = lastFetchedAt.current ?? [];
    const movedFar =
      lastFetchedAt.current === null ||
      getDistance(lastLat!, lastLng!, userLocation[1], userLocation[0]) > REROUTE_THRESHOLD_M;

    if (!movedFar) return;

    lastFetchedAt.current = userLocation;
    const thisRequestId = ++requestIdRef.current;

    const updateRoute = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      // Ignore stale responses if a newer request has since started
      if (thisRequestId !== requestIdRef.current) return;
      if (!data.routes || data.routes.length === 0) return;
      if (!map.current) return;

      const route = data.routes[0];
      const coords = route.geometry;

      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: coords,
        });
      } else {
        const addRoute = () => {
          if (!map.current) return;

          new mapboxgl.Marker({ color: '#0D9488' })
            .setLngLat(destination)
            .setPopup(new mapboxgl.Popup().setText(destinationName ?? 'Destination'))
            .addTo(map.current);

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
        };

        if (map.current.isStyleLoaded()) {
          addRoute();
        } else {
          map.current.on('load', addRoute);
        }
      }

      if (onRouteInfoRef.current) {
        const duration = Math.ceil(route.duration / 60);
        const distance = route.distance < 1000
          ? `${Math.round(route.distance)}m`
          : `${(route.distance / 1000).toFixed(1)}km`;
        const firstStep = route.legs[0].steps[0].maneuver.instruction;
        onRouteInfoRef.current({ direction: firstStep, time: `${duration}min`, distance });
      }
    };

    updateRoute();
  }, [userLocation, destination]);

  return <div ref={mapContainer} className="w-full h-full" />;
}