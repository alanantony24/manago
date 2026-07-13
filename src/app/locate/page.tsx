'use client';

import { useEffect, useState, useRef } from 'react';
import MapView from '../components/MapView';
import { supabase } from '../../lib/supabase';

interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

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

const ARRIVAL_THRESHOLD_M = 20;

export default function LocatePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [nearestFacility, setNearestFacility] = useState<Facility | null>(null);
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
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
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

  // Recompute nearest facility locally whenever location or facility list changes
  useEffect(() => {
    if (!userLocation || facilities.length === 0) return;

    const [userLng, userLat] = userLocation;

    let closest = facilities[0];
    let closestDist = getDistance(userLat, userLng, closest.latitude, closest.longitude);

    for (const facility of facilities) {
      const dist = getDistance(userLat, userLng, facility.latitude, facility.longitude);
      if (dist < closestDist) {
        closest = facility;
        closestDist = dist;
      }
    }

    setNearestFacility(closest);

    if (closestDist <= ARRIVAL_THRESHOLD_M) {
      setArrived(true);
    }
  }, [userLocation, facilities]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-zinc-800">
      <div className="relative w-[390px] h-[844px] bg-white overflow-hidden shadow-2xl rounded-3xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200">
          <h1 className="text-xl font-semibold text-zinc-900">Find Nearest Amenity</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading && 'Getting your location...'}
            {locationError && locationError}
            {fetchError && fetchError}
            {userLocation && !loading && !fetchError && 'Locating amenities near you'}
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
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

        {/* Bottom Nav Panel */}
        {routeInfo && nearestFacility && (
          <div className="bg-teal-600 text-white px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{nearestFacility.name}</p>
                <p className="text-2xl font-bold">{routeInfo.direction}</p>
                <p className="text-sm opacity-80 mt-0.5">
                  {routeInfo.time} • {routeInfo.distance}
                </p>
              </div>
              <button
                onClick={() => setRouteInfo(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-full text-sm"
              >
                EXIT
              </button>
            </div>

            <button
              onClick={() => setArrived(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full text-sm"
            >
              {arrived ? '✅ You have arrived!' : 'Arrived?'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}