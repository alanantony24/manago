'use client';

import { useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

const CARD =
  "bg-white rounded-2xl shadow-md p-5 m-4";

const BUTTON =
  "px-4 py-2 rounded-xl border transition-colors";

export default function Location() {
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

  // const [location, setLocation] = useState("");
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [exactLocation, setExactLocation] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);


  const [errors, setErrors] = useState({
  facility: "",
  location: "",
  exactLocation: "",
  openingHours: "",
  closingHours: "",
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
    if (!image) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);


  async function searchLocation(query: string) {
    setLocationQuery(query);

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

  async function handleSubmit() {

  // ⭐ NEW - clear previous errors
  setErrors({
    facility: "",
    location: "",
    exactLocation: "",
    openingHours: "",
    closingHours: "",
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
    closingHours: "",
    image: "",
  };

  if (selectedFacilities.length === 0) {
    newErrors.facility = "Please select at least one facility type.";
  }

  if (!locationQuery.trim() || latitude === null || longitude === null) {
    newErrors.location = "Please select a location from the suggestions.";
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
    setSuggestions([]);

    setOpenTime("");
    setCloseTime("");
    setIs24Hours(false);

    setImage(null);
    setPreview(null);

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
    <main className="min-h-screen bg-gray-100 pb-8">
      <Navbar />

      {/* Facility Type */}
      <section className={CARD}>
        <h2 className="mb-4 text-xl font-bold">
          Facility Type
          <span className="ml-1 text-red-500">*</span>
        </h2>

        {errors.facility && (
  <p className="mt-2 text-sm text-red-500">
    {errors.facility}
  </p>
)}
        <div className="flex flex-wrap gap-3">
          {facilities.map(facility => (
            <button
              key={facility}
              type="button"
              onClick={() => toggleButton(facility)}
              className={`${BUTTON} ${selected[facility]
                ? "bg-[#A3C793] border-[#0B7F7F]"
                : "bg-white border-gray-300"
                }`}
            >
              {facility}
            </button>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className={CARD}>
        <h2 className="mb-4 text-xl font-bold">
          Location
          <span className="ml-1 text-red-500">*</span>
        </h2>
        <p className="">eg. City Square Mall Level 2 Toilet</p>

          {errors.location && (
  <p className="mt-2 text-sm text-red-500">
    {errors.location}
  </p>
)}
        <input
          type="text"
          placeholder="Search for a location"
          value={locationQuery}
          onChange={(e) => searchLocation(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3"

        />

        {suggestions.length > 0 && (
          <div className="mt-2 rounded-xl border border-gray-300 bg-white shadow">
            {suggestions.map((place: any) => (
              <button
                key={place.id}
                type="button"
                className="block w-full px-4 py-3 text-left hover:bg-gray-100"
                onClick={() => {
                  setLocationQuery(place.place_name);
                  setLatitude(place.center[1]);
                  setLongitude(place.center[0]);
                  setSuggestions([]);
                }}
              >
                {place.place_name}
              </button>
            ))}
          </div>
        )}

{errors.exactLocation && (
  <p className="mt-2 text-sm text-red-500">
    {errors.exactLocation}
  </p>
)}
        <input
          type="text"
          placeholder="Floor / Exact area (e.g. Level 2 beside KFC)"
          value={exactLocation}
          onChange={(e) => setExactLocation(e.target.value)}
          className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </section>



      {/* Opening Hours */}
      <div className={CARD}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Opening Hours</h2>

{errors.openingHours && (
  <p className="mt-2 text-sm text-red-500">
    {errors.openingHours}
  </p>
)}
          <button
            type="button"
            onClick={toggle24Hours}
            className={`px-4 py-2 rounded-xl border ${is24Hours
              ? "bg-[#0B7F7F] text-white border-[#0B7F7F]"
              : "bg-white border-gray-300"
              }`}
          >
            24 Hours
          </button>


        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Opens
            </label>

            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              disabled={is24Hours}
              className={`w-full rounded-xl border px-3 py-2 transition
        ${is24Hours
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                  : "border-gray-300 bg-white focus:border-[#0B7F7F] focus:outline-none"
                }`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Closes
            </label>

            {errors.closingHours && (
  <p className="mt-2 text-sm text-red-500">
    {errors.closingHours}
  </p>
)}

            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              disabled={is24Hours}
              className={`w-full rounded-xl border px-3 py-2 transition
        ${is24Hours
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                  : "border-gray-300 bg-white focus:border-[#0B7F7F] focus:outline-none"
                }`}
            />
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <section className={CARD}>
        <h2 className="mb-4 text-xl font-bold">
          Photo Upload
        </h2>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-10 transition hover:border-[#0B7F7F] hover:bg-gray-50">
          <span className="text-5xl">📷</span>

          <span className="mt-3 text-gray-500">
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
              setPreview(URL.createObjectURL(file));
            }}
          />
        </label>

{errors.image && (
  <p className="mt-2 text-sm text-red-500">
    {errors.image}
  </p>
)}
        {image && (
          <p className="mt-3 text-sm text-green-600">
            ✓ {image.name}
          </p>
        )}

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Selected image preview"
              className="h-48 w-full rounded-xl border object-cover"
            />
          </div>
        )}
      </section>

      {/* Features */}
      <section className={CARD}>
        <h2 className="mb-4 text-xl font-bold">
          Features
        </h2>

        <div className="flex flex-wrap gap-3">
          {features.map(feature => (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              className={`${BUTTON} ${selectedFeatures[feature]
                ? "bg-[#A3C793] border-[#0B7F7F]"
                : "bg-white border-gray-300"
                }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </section>

      {/* Notice */}
      <section className="mx-4 rounded-2xl bg-[#CBF0ED] p-5">
        <p className="text-center text-[#084F4F]">
          Every submission is reviewed by our team before going live.
        </p>
      </section>

      {/* Submit */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-2xl bg-[#0B7F7F] px-10 py-4 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </main>
  );
}