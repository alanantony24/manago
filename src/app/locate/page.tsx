'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MapView, { type MapViewHandle } from '@/app/components/MapView';
import { AppPageHeader } from '@/components/app-page-header';
import { getDistanceMeters } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import {
  Footprints,
  Bike,
  Car,
  Bus,
  Navigation,
  LocateFixed,
  MapPin,
  X,
  ArrowUp,
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

type TravelMode = 'walking' | 'cycling' | 'driving';

const ARRIVAL_THRESHOLD_M = 20;

function getManeuverRotation(modifier?: string): number {
  switch (modifier) {
    case 'left':
      return -90;
    case 'right':
      return 90;
    case 'sharp left':
      return -135;
    case 'sharp right':
      return 135;
    case 'slight left':
      return -45;
    case 'slight right':
      return 45;
    case 'uturn':
      return 180;
    default:
      return 0; // straight
  }
}

function formatManeuverDistance(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

function LocatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facilityId = searchParams.get('facilityId');
  const mapRef = useRef<MapViewHandle>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [specificFacility, setSpecificFacility] = useState<Facility | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    direction: string;
    time: string;
    distance: string;
    road?: string;
    arrivalTime?: string;
    maneuverModifier?: string;
    maneuverDistance?: number;
  } | null>(null);
  const [arrived, setArrived] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [navigationStarted, setNavigationStarted] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Warm up /nearby's code in the background so Exit feels snappier - it
  // still has to init its own map + refetch facilities, but at least the
  // JS bundle is already loaded by the time you tap Exit.
  useEffect(() => {
    router.prefetch('/nearby');
  }, [router]);

  // Watch user location continuously
  useEffect(() => {
    if (!navigator.geolocation) {
      const timeoutId = window.setTimeout(() => {
        setLocationError('Geolocation is not supported by your browser.');
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
        setLoading(false);
      },
      () => {
        setLocationError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // If a specific facility was requested (from its detail page's "Navigate"
  // button), fetch just that one — no need to pull the whole list.
  useEffect(() => {
    if (!facilityId) return;

    const fetchSpecificFacility = async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, latitude, longitude')
        .eq('id', facilityId)
        .single();

      if (error || !data) {
        setFetchError('Could not find that facility.');
        return;
      }

      setSpecificFacility(data);
    };

    fetchSpecificFacility();
  }, [facilityId]);

  // Otherwise (no facilityId in the URL), fall back to "nearest verified
  // facility" mode - fetch the list once, not on every location update.
  useEffect(() => {
    if (facilityId) return;

    const fetchFacilities = async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, latitude, longitude')
        .eq('is_verified', true)
        .eq('status', 'active');

      if (error) {
        setFetchError(`Failed to fetch facilities: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setFetchError('No verified facilities found in the database.');
        return;
      }

      setFacilities(data);
    };

    fetchFacilities();
  }, [facilityId]);

  const nearestResult = useMemo(() => {
    if (facilityId || !userLocation || facilities.length === 0) return null;

    const [userLng, userLat] = userLocation;

    let closest = facilities[0];
    let closestDist = getDistanceMeters(userLat, userLng, closest.latitude, closest.longitude);

    for (const facility of facilities) {
      const dist = getDistanceMeters(userLat, userLng, facility.latitude, facility.longitude);
      if (dist < closestDist) {
        closest = facility;
        closestDist = dist;
      }
    }

    return { facility: closest, distance: closestDist };
  }, [facilityId, userLocation, facilities]);

  const destinationFacility = facilityId ? specificFacility : nearestResult?.facility ?? null;

  const distanceToDestination =
    userLocation && destinationFacility
      ? getDistanceMeters(
          userLocation[1],
          userLocation[0],
          destinationFacility.latitude,
          destinationFacility.longitude
        )
      : null;

  const hasArrived =
    arrived || (distanceToDestination !== null && distanceToDestination <= ARRIVAL_THRESHOLD_M);

  const headerSubtitle = destinationFacility
    ? `Navigating to ${destinationFacility.name}`
    : 'Find Nearest Amenity';

  const handleExit = () => {
    router.push('/nearby');
  };

  const handleRate = () => {
    if (!destinationFacility) return;
    router.push(`/facilities/${destinationFacility.id}`);
  };

  // First tap begins the trip; once started, tapping again (either
  // manually or once auto-arrival kicks in) takes the user to rate the
  // facility - that's the actual point of this button, not just a label.
  const handlePrimaryButton = () => {
    if (!navigationStarted) {
      setNavigationStarted(true);
      return;
    }
    setArrived(true);
    handleRate();
  };

  const primaryButtonLabel = !navigationStarted
    ? 'Start Navigation'
    : hasArrived
      ? '✅ Arrived — Tap to Rate'
      : 'Mark as Arrived';

  const travelModeButtonClass = (mode: TravelMode) =>
    `rounded-full p-3 transition-all duration-200 ${
      travelMode === mode
        ? 'bg-manago-teal text-white shadow-md scale-110'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-manago-navy">
      <AppPageHeader subtitle={headerSubtitle} />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Navigation className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Your Location</p>
              <p className="font-semibold">Current Location</p>
            </div>
          </div>

          <div className="my-2 ml-2 h-6 border-l-2 border-dashed border-gray-300" />

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Destination</p>
              <p className="font-semibold">
                {destinationFacility?.name ?? 'Finding destination...'}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {loading && 'Getting your location...'}
            {locationError && locationError}
            {fetchError && fetchError}
          </p>
        </div>

        <div className="relative min-h-[50vh] flex-1">
          <div className="absolute inset-0">
            <MapView
              ref={mapRef}
              travelMode={travelMode}
              userLocation={userLocation}
              destination={
                destinationFacility
                  ? [destinationFacility.longitude, destinationFacility.latitude]
                  : null
              }
              destinationName={destinationFacility?.name}
              onRouteInfo={setRouteInfo}
            />
          </div>

          {navigationStarted && routeInfo && (
            <div className="absolute left-4 right-4 top-4 flex items-center gap-3 rounded-2xl bg-manago-teal p-4 text-white shadow-lg">
              <ArrowUp
                className="h-8 w-8 shrink-0"
                style={{
                  transform: `rotate(${getManeuverRotation(routeInfo.maneuverModifier)}deg)`,
                }}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{routeInfo.direction}</p>
                {formatManeuverDistance(routeInfo.maneuverDistance) && (
                  <p className="text-sm text-white/80">
                    in {formatManeuverDistance(routeInfo.maneuverDistance)}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => mapRef.current?.recenter()}
            className="absolute bottom-6 right-6 rounded-full bg-white p-3 shadow-lg"
            aria-label="Recenter map"
          >
            <LocateFixed className="h-6 w-6 text-manago-teal" />
          </button>
        </div>

        {routeInfo && destinationFacility && (
          <div className="relative rounded-t-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              aria-label="Exit navigation"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setTravelMode('walking')}
                className={travelModeButtonClass('walking')}
                aria-label="Walking directions"
              >
                <Footprints className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setTravelMode('cycling')}
                className={travelModeButtonClass('cycling')}
                aria-label="Cycling directions"
              >
                <Bike className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setTravelMode('driving')}
                className={travelModeButtonClass('driving')}
                aria-label="Driving directions"
              >
                <Car className="h-6 w-6" />
              </button>

              <button
                type="button"
                disabled
                className="rounded-full bg-gray-100 p-3 text-gray-400 cursor-not-allowed"
                aria-label="Bus directions (coming soon)"
              >
                <Bus className="h-6 w-6" />
              </button>
            </div>

            <div>
              <h2 className="text-5xl font-bold">{routeInfo.time}</h2>
              {routeInfo.arrivalTime && (
                <p className="mt-1 text-gray-500">Arrive {routeInfo.arrivalTime}</p>
              )}
              {routeInfo.road && <p className="mt-2">Via {routeInfo.road}</p>}
              <p className="text-gray-500">{routeInfo.distance}</p>
            </div>

            <button
              type="button"
              onClick={handlePrimaryButton}
              className="mt-6 w-full rounded-full bg-manago-teal py-4 font-bold text-white"
            >
              {primaryButtonLabel}
            </button>
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-manago-navy">Exit navigation?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to exit? You&apos;ll be taken back to the home page.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-manago-navy hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LocatePage() {
  return (
    <Suspense fallback={null}>
      <LocatePageInner />
    </Suspense>
  );
}
