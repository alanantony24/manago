'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MANAGO_BRAND_ORANGE, MANAGO_TEAL } from '@/lib/brand-colors';
import { getBearing, getDistanceMeters } from '@/lib/geo';

type TravelMode = 'walking' | 'cycling' | 'driving';

const TRAVEL_MODES = new Set<TravelMode>(['walking', 'cycling', 'driving']);

/** Normalize travel mode; fall back to walking if the value is unexpected. */
function resolveTravelMode(mode: TravelMode | undefined): TravelMode {
  return mode && TRAVEL_MODES.has(mode) ? mode : 'walking';
}

interface Props {
  userLocation: [number, number] | null;
  destination: [number, number] | null;
  destinationName?: string;
  travelMode?: TravelMode;
  onRouteInfo?: (info: {
    direction: string;
    time: string;
    distance: string;
    road?: string;
    arrivalTime?: string;
    maneuverModifier?: string;
    maneuverDistance?: number;
  }) => void;
}

export interface MapViewHandle {
  recenter: () => void;
}

const REROUTE_THRESHOLD_M = 15;
const BEARING_UPDATE_THRESHOLD_M = 3;
const NAV_PITCH = 55;

function createPuckElement() {
  const el = document.createElement('div');
  el.style.width = '34px';
  el.style.height = '34px';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.innerHTML = `
    <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="17" r="15" fill="${MANAGO_TEAL}" fill-opacity="0.18" />
      <circle cx="17" cy="17" r="9" fill="${MANAGO_TEAL}" stroke="white" stroke-width="2.5" />
      <path d="M17 5 L22 15 L17 12 L12 15 Z" fill="white" />
    </svg>
  `;
  return el;
}

/** Turn-by-turn Mapbox map for the Locate flow (user puck + route line). */
const MapView = forwardRef<MapViewHandle, Props>(function MapView(
  { userLocation, destination, destinationName, travelMode = 'walking', onRouteInfo },
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const puckEl = useRef<HTMLDivElement | null>(null);
  const onRouteInfoRef = useRef(onRouteInfo);
  const lastFetchedAt = useRef<[number, number] | null>(null);
  const requestIdRef = useRef(0);
  const prevLocationForBearing = useRef<[number, number] | null>(null);
  const lastBearing = useRef(0);
  const lastTravelModeRef = useRef(travelMode);

  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo;
  }, [onRouteInfo]);

  useImperativeHandle(
    ref,
    () => ({
      recenter: () => {
        if (!map.current || !userLocation) return;
        map.current.easeTo({
          center: userLocation,
          bearing: lastBearing.current,
          pitch: NAV_PITCH,
          duration: 500,
        });
      },
    }),
    [userLocation]
  );

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

    // Work out heading from the last fix so the map/puck can face the
    // direction of travel, like turn-by-turn nav apps do. Ignore tiny GPS
    // jitter so the camera doesn't spin while the user is standing still.
    const prev = prevLocationForBearing.current;
    if (prev) {
      const moved = getDistanceMeters(prev[1], prev[0], userLocation[1], userLocation[0]);
      if (moved > BEARING_UPDATE_THRESHOLD_M) {
        lastBearing.current = getBearing(prev[1], prev[0], userLocation[1], userLocation[0]);
        prevLocationForBearing.current = userLocation;
      }
    } else {
      prevLocationForBearing.current = userLocation;
    }

    if (userMarker.current) {
      userMarker.current.setLngLat(userLocation);
    } else {
      puckEl.current = createPuckElement();
      userMarker.current = new mapboxgl.Marker({ element: puckEl.current })
        .setLngLat(userLocation)
        .addTo(map.current);
    }

    map.current.easeTo({
      center: userLocation,
      bearing: lastBearing.current,
      pitch: NAV_PITCH,
      duration: 500,
    });

    // Refetch the route if the user moved far enough, OR if they just
    // switched travel mode (walking/cycling/driving use different roads).
    const [lastLng, lastLat] = lastFetchedAt.current ?? [];
    const movedFar =
      lastFetchedAt.current === null ||
      getDistanceMeters(lastLat!, lastLng!, userLocation[1], userLocation[0]) >
        REROUTE_THRESHOLD_M;
    const travelModeChanged = lastTravelModeRef.current !== travelMode;
    lastTravelModeRef.current = travelMode;

    if (!movedFar && !travelModeChanged) return;

    lastFetchedAt.current = userLocation;
    const thisRequestId = ++requestIdRef.current;

    const updateRoute = async () => {
      const mode = resolveTravelMode(travelMode);
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLocation[0]},${userLocation[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

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

          new mapboxgl.Marker({ color: MANAGO_BRAND_ORANGE })
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
            paint: { 'line-color': MANAGO_TEAL, 'line-width': 5 },
          });
        };

        if (map.current.isStyleLoaded()) {
          addRoute();
        } else {
          map.current.on('load', addRoute);
        }
      }

      // If the source already existed (mode change, not first draw), make
      // sure the line reflects the new geometry too.
      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: coords,
        });
      }

      if (onRouteInfoRef.current) {
        const duration = Math.ceil(route.duration / 60);
        const distance = route.distance < 1000
          ? `${Math.round(route.distance)}m`
          : `${(route.distance / 1000).toFixed(1)}km`;
        const firstStep = route.legs[0].steps[0].maneuver.instruction;
        const road = route.legs[0].summary || undefined;
        const arrivalTime = new Date(Date.now() + route.duration * 1000).toLocaleTimeString(
          [],
          { hour: '2-digit', minute: '2-digit' }
        );
        const maneuverModifier = route.legs[0].steps[0].maneuver.modifier as
          | string
          | undefined;
        const maneuverDistance = route.legs[0].steps[0].distance as number | undefined;

        onRouteInfoRef.current({
          direction: firstStep,
          time: `${duration}min`,
          distance,
          road,
          arrivalTime,
          maneuverModifier,
          maneuverDistance,
        });
      }
    };

    updateRoute();
  }, [userLocation, destination, destinationName, travelMode]);

  return <div ref={mapContainer} className="w-full h-full" />;
});

export default MapView;
