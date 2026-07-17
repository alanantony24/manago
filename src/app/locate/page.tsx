'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MapView from '@/app/components/MapView';
import { AppPageHeader } from '@/components/app-page-header';
import { getDistanceMeters } from '@/lib/geo';
import { supabase } from '@/lib/supabase';

interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const ARRIVAL_THRESHOLD_M = 20;

export default function LocatePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    direction: string;
    time: string;
    distance: string;
  } | null>(null);
  const [arrived, setArrived] = useState(false);
  const watchIdRef = useRef<number | null>(null);

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

  // Fetch facilities once (not on every location update)
  useEffect(() => {
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
  }, []);

  const nearestResult = useMemo(() => {
    if (!userLocation || facilities.length === 0) return null;

    const [userLng, userLat] = userLocation;

    let closest = facilities[0];
    let closestDist = getDistanceMeters(
      userLat,
      userLng,
      closest.latitude,
      closest.longitude
    );

    for (const facility of facilities) {
      const dist = getDistanceMeters(
        userLat,
        userLng,
        facility.latitude,
        facility.longitude
      );
      if (dist < closestDist) {
        closest = facility;
        closestDist = dist;
      }
    }

    return { facility: closest, distance: closestDist };
  }, [userLocation, facilities]);

  const nearestFacility = nearestResult?.facility ?? null;
  const hasArrived =
    arrived ||
    (nearestResult !== null && nearestResult.distance <= ARRIVAL_THRESHOLD_M);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-manago-navy">
      <AppPageHeader subtitle="Find Nearest Amenity" />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">
            {loading && "Getting your location..."}
            {locationError && locationError}
            {fetchError && fetchError}
            {userLocation && !loading && !fetchError && "Locating amenities near you"}
          </p>
        </div>

        <div className="relative min-h-[50vh] flex-1">
          <div className="absolute inset-0">
            <MapView
              userLocation={userLocation}
              destination={
                nearestFacility
                  ? [nearestFacility.longitude, nearestFacility.latitude]
                  : null
              }
              destinationName={nearestFacility?.name}
              onRouteInfo={setRouteInfo}
            />
          </div>
        </div>

        {routeInfo && nearestFacility && (
          <div className="flex flex-col gap-3 bg-manago-teal px-5 py-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium opacity-80">{nearestFacility.name}</p>
                <p className="text-2xl font-bold">{routeInfo.direction}</p>
                <p className="mt-0.5 text-sm opacity-80">
                  {routeInfo.time} • {routeInfo.distance}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRouteInfo(null)}
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                EXIT
              </button>
            </div>

            <button
              type="button"
              onClick={() => setArrived(true)}
              className="w-full rounded-full bg-white py-3 text-sm font-semibold text-manago-teal hover:bg-manago-mint"
            >
              {hasArrived ? "✅ You have arrived!" : "Arrived?"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}