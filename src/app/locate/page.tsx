'use client';

import { useEffect, useState } from 'react';
import MapView from '../components/MapView';

export default function LocatePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{
    direction: string;
    time: string;
    distance: string;
  } | null>(null); // starting default null 
  
  // when user clicks Arrived, changes to true 
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // if successful 
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
        setLoading(false);
      },
      // not successful 
      () => {
        setLocationError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      }
    );
  }, []); // run only once 

  // iphone 14 screen size  
  // hardcoded with 'Raffles City B1 Toilet' 
  return (
    <div className="flex justify-center items-center min-h-screen bg-zinc-800">
      <div className="relative w-[390px] h-[844px] bg-white overflow-hidden shadow-2xl rounded-3xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200">
          <h1 className="text-xl font-semibold text-zinc-900">Find Nearest Amenity</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading && 'Getting your location...'}
            {locationError && locationError}
            {userLocation && !loading && 'Locating amenities near you'}
          </p>
        </div>

        {/* Map */}
        <div className="flex-1">
          <MapView
            userLocation={userLocation}
            onRouteInfo={(info) => {
              setRouteInfo(info);
              setArrived(false);
            }}
          />
        </div>

        {/* Bottom Nav Panel */}
        {routeInfo && (
          <div className="bg-teal-600 text-white px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Raffles City B1 Toilet</p>
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
