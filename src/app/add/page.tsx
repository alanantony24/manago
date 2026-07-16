'use client';

import { useEffect, useMemo, useState } from "react";
import { LocateFixed } from "lucide-react";
import { AppPageHeader } from "@/components/app-page-header";
import { supabase } from "@/lib/supabase";

const CARD =
  "m-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

const BUTTON =
  "rounded-xl border px-4 py-2 text-sm font-medium text-manago-navy transition-colors";

const SECTION_TITLE = "mb-4 text-xl font-bold text-manago-navy";

const INPUT =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-manago-navy placeholder:text-gray-500 focus:border-manago-teal-dark focus:outline-none focus:ring-2 focus:ring-manago-teal/30";

type MapboxSuggestion = {
  id: string;
  place_name: string;
  center: [number, number];
};

export default function AddFacilityPage() {
  const facilities = [
    "Toilet w/ bidet",
    "Toilet",
    "Water Cooler",
    "Nursing Home",
    "Baby Changing",
  ];

  const features = [
    "Bidet",
    "Baby Changing",
    "Wheelchair Accessible",
    "Grab Bars",
    "Soap",
    "Hand Dryer",
  ];

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectedFeatures, setSelectedFeatures] =
    useState<Record<string, boolean>>({});
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [exactLocation, setExactLocation] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");


  const [errors, setErrors] = useState({
    facility: "",
    location: "",
    exactLocation: "",
    openingHours: "",
    image: "",
  });

  const toggleButton = (facility: string) => {
    setSelected(prev => ({
      ...prev,
      [facility]: !prev[facility],
    }));
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const toggle24Hours = () => {
    setIs24Hours(prev => !prev);
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);


  async function searchLocation(query: string) {
    setLocationQuery(query);
    setLocationStatus("");
    setIsUsingCurrentLocation(false);
    setLatitude(null);
    setLongitude(null);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?country=sg&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
    );

    const data = await response.json();

    setSuggestions(data.features ?? []);
  }

  function handleUseCurrentLocation() {
    setLocationStatus("");

    if (!navigator.geolocation) {
      setLocationStatus("Current location is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsUsingCurrentLocation(true);
        setSuggestions([]);
        setErrors((prev) => ({ ...prev, location: "" }));
        setLocationStatus(
          "Current location pinned. Type the place name in the field above."
        );
        setIsLocating(false);
      },
      () => {
        setLocationStatus(
          "Unable to get your current location. Please allow location access and try again."
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function handleSearchInstead() {
    setIsUsingCurrentLocation(false);
    setLatitude(null);
    setLongitude(null);
    setSuggestions([]);
    setLocationStatus("Search mode enabled. Choose a location from the dropdown.");
  }

  async function handleSubmit() {

    // clear previous errors
    setErrors({
      facility: "",
      location: "",
      exactLocation: "",
      openingHours: "",
      image: "",
    });

    const selectedFacilities = Object.keys(selected).filter(
      (key) => selected[key]
    );

    const selectedFeatureList = Object.keys(selectedFeatures).filter(
      (key) => selectedFeatures[key]
    );

    // validation
    const newErrors = {
      facility: "",
      location: "",
      exactLocation: "",
      openingHours: "",
      image: "",
    };

    if (selectedFacilities.length === 0) {
      newErrors.facility = "Please select at least one facility type.";
    }

    if (!locationQuery.trim() || latitude === null || longitude === null) {
      newErrors.location =
        "Please select a location from the suggestions or use your current location pin.";
    }

    if (!exactLocation.trim()) {
      newErrors.exactLocation = "Please enter the floor or exact location.";
    }

    if (!is24Hours && (!openTime || !closeTime)) {
      newErrors.openingHours = "Please enter both opening and closing times.";
    }

    if (!image) {
      newErrors.image = "Please upload a photo.";
    }

    if (
      newErrors.facility ||
      newErrors.location ||
      newErrors.exactLocation ||
      newErrors.openingHours ||
      newErrors.image
    ) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image
      if (image) {
        const fileName = `${Date.now()}-${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from("addlocation-images")
          .upload(fileName, image);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        imageUrl = supabase.storage
          .from("addlocation-images")
          .getPublicUrl(fileName).data.publicUrl;
      }

      // Save to Supabase
      const { error } = await supabase
        .from("add_new_facility")
        .insert([
          {
            location: locationQuery,
            exact_location: exactLocation,
            latitude,
            longitude,
            facility_type: selectedFacilities,
            features: selectedFeatureList,
            open_time: is24Hours ? null : openTime,
            close_time: is24Hours ? null : closeTime,
            is_24_hours: is24Hours,
            image_url: imageUrl,
          },
        ]);

      if (error) throw new Error(error.message);

      alert("Submission successful!");

      // Reset form
      setSelected({});
      setSelectedFeatures({});
      setLocationQuery("");
      setExactLocation("");
      setLatitude(null);
      setLongitude(null);
      setIsUsingCurrentLocation(false);
      setSuggestions([]);
      setLocationStatus("");

      setOpenTime("");
      setCloseTime("");
      setIs24Hours(false);

      setImage(null);

    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen bg-gray-50 pb-8 text-manago-navy">
      <AppPageHeader subtitle="Add a Facility" />

      {/* Facility Type */}
      <section className={CARD}>
        <h2 className={SECTION_TITLE}>
          Facility Type
          <span className="ml-1 text-red-500">*</span>
        </h2>

        {errors.facility && (
          <p className="mb-3 text-sm text-red-600">{errors.facility}</p>
        )}
        <div className="flex flex-wrap gap-3">
          {facilities.map((facility) => (
            <button
              key={facility}
              type="button"
              onClick={() => toggleButton(facility)}
              className={`${BUTTON} ${
                selected[facility]
                  ? "border-manago-teal-dark bg-manago-chip"
                  : "border-gray-500 bg-white hover:border-manago-teal"
              }`}
            >
              {facility}
            </button>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className={CARD}>
        <h2 className={SECTION_TITLE}>
          Location
          <span className="ml-1 text-red-500">*</span>
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          eg. City Square Mall Level 2 Toilet
        </p>

        {errors.location && (
          <p className="mb-2 text-sm text-red-600">{errors.location}</p>
        )}
        <input
          type="text"
          aria-label={
            isUsingCurrentLocation ? "Place name" : "Search for a location"
          }
          placeholder={
            isUsingCurrentLocation
              ? "Type the place name"
              : "Search for a location"
          }
          value={locationQuery}
          onChange={(e) => {
            if (isUsingCurrentLocation) {
              setLocationQuery(e.target.value);
              return;
            }

            searchLocation(e.target.value);
          }}
          className={INPUT}
        />

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className={`${BUTTON} mt-3 flex w-full items-center justify-center gap-2 disabled:opacity-60 ${
            isUsingCurrentLocation
              ? "border-manago-teal-dark bg-manago-teal-dark text-white"
              : "border-manago-teal-dark bg-manago-chip"
          }`}
          title="Use your current location for latitude and longitude"
        >
          <LocateFixed className="size-4" aria-hidden />
          {isLocating
            ? "Getting current location..."
            : isUsingCurrentLocation
              ? "Current location pinned"
              : "Use current location pin"}
        </button>

        {isUsingCurrentLocation && (
          <button
            type="button"
            onClick={handleSearchInstead}
            className={`${BUTTON} mt-2 w-full border-gray-500 bg-white hover:border-manago-teal`}
          >
            Search for location instead
          </button>
        )}

        {locationStatus && (
          <p className="mt-2 text-sm text-gray-600">{locationStatus}</p>
        )}

        {latitude !== null && longitude !== null && (
          <p className="mt-2 text-xs text-gray-500">
            Coordinates set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-2 rounded-xl border border-gray-300 bg-white shadow-sm">
            {suggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                className="block w-full px-4 py-3 text-left text-manago-navy hover:bg-gray-50"
                onClick={() => {
                  setLocationQuery(place.place_name);
                  setLatitude(place.center[1]);
                  setLongitude(place.center[0]);
                  setIsUsingCurrentLocation(false);
                  setSuggestions([]);
                  setLocationStatus("Location selected from suggestions.");
                }}
              >
                {place.place_name}
              </button>
            ))}
          </div>
        )}

        {errors.exactLocation && (
          <p className="mt-2 text-sm text-red-600">{errors.exactLocation}</p>
        )}
        <input
          type="text"
          placeholder="Floor / Exact area (e.g. Level 2 beside KFC)"
          value={exactLocation}
          onChange={(e) => setExactLocation(e.target.value)}
          className={`mt-3 ${INPUT}`}
        />
      </section>

      {/* Opening Hours */}
      <div className={CARD}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-manago-navy">Opening Hours</h2>

          <button
            type="button"
            onClick={toggle24Hours}
            className={`${BUTTON} ${
              is24Hours
                ? "border-manago-teal-dark bg-manago-teal-dark text-white"
                : "border-gray-500 bg-white hover:border-manago-teal"
            }`}
          >
            24 Hours
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Opens
            </label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              disabled={is24Hours}
              className={`w-full rounded-xl border px-3 py-2 text-manago-navy transition ${
                is24Hours
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-300 bg-white focus:border-manago-teal-dark focus:outline-none focus:ring-2 focus:ring-manago-teal/30"
              }`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Closes
            </label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              disabled={is24Hours}
              className={`w-full rounded-xl border px-3 py-2 text-manago-navy transition ${
                is24Hours
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-300 bg-white focus:border-manago-teal-dark focus:outline-none focus:ring-2 focus:ring-manago-teal/30"
              }`}
            />
          </div>
        </div>

        {errors.openingHours && (
          <p className="mt-2 text-sm text-red-600">{errors.openingHours}</p>
        )}
      </div>

      {/* Photo Upload */}
      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Photo Upload</h2>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 py-10 transition hover:border-manago-teal-dark hover:bg-manago-mint/30">
          <span className="text-5xl" aria-hidden>
            📷
          </span>
          <span className="mt-3 text-sm font-medium text-gray-600">
            Tap to add a photo
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImage(file);
            }}
          />
        </label>

        {errors.image && (
          <p className="mt-2 text-sm text-red-600">{errors.image}</p>
        )}
        {image && (
          <p className="mt-3 text-sm font-medium text-manago-teal-dark">
            ✓ {image.name}
          </p>
        )}

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Selected image preview"
              className="h-48 w-full rounded-xl border border-gray-200 object-cover"
            />
          </div>
        )}
      </section>

      {/* Features */}
      <section className={CARD}>
        <h2 className="mb-4 flex items-baseline gap-2">
          <span className="text-xl font-bold text-manago-navy">Features</span>
          <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          {features.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              className={`${BUTTON} ${
                selectedFeatures[feature]
                  ? "border-manago-teal-dark bg-manago-chip"
                  : "border-gray-500 bg-white hover:border-manago-teal"
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </section>

      {/* Notice */}
      <section className="mx-4 rounded-2xl bg-manago-notice p-5">
        <p className="text-center text-sm font-medium text-manago-notice-text">
          Every submission is reviewed by our team before going live.
        </p>
      </section>

      {/* Submit */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-2xl bg-manago-teal-dark px-10 py-4 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </main>
  );
}
