'use client';

import { useState } from "react";
import Navbar from "../components/Navbar";

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

  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState("");
const [closeTime, setCloseTime] = useState("");

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

  return (
    <main className="min-h-screen bg-gray-100 pb-8">
      <Navbar />

      {/* Facility Type */}
      <section className={CARD}>
        <h2 className="mb-4 text-xl font-bold">
          Facility Type
          <span className="ml-1 text-red-500">*</span>
        </h2>

        <div className="flex flex-wrap gap-3">
          {facilities.map(facility => (
            <button
              key={facility}
              type="button"
              onClick={() => toggleButton(facility)}
              className={`${BUTTON} ${
                selected[facility]
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

        <input
          type="text"
          placeholder="Enter location"
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </section>

      {/* Opening Hours */}
      <div className={CARD}>
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-xl font-bold">Opening Hours</h2>

    <button
      type="button"
      onClick={toggle24Hours}
      className={`px-4 py-2 rounded-xl border ${
        is24Hours
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
        ${
          is24Hours
            ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
            : "border-gray-300 bg-white focus:border-[#0B7F7F] focus:outline-none"
        }`}
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-gray-600">
      Closes
    </label>

    <input
      type="time"
      value={closeTime}
      onChange={(e) => setCloseTime(e.target.value)}
      disabled={is24Hours}
      className={`w-full rounded-xl border px-3 py-2 transition
        ${
          is24Hours
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
            className="hidden"
          />
        </label>
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
              className={`${BUTTON} ${
                selectedFeatures[feature]
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
        <button className="rounded-2xl bg-[#0B7F7F] px-10 py-4 font-semibold text-white transition hover:bg-[#096666]">
          Submit
        </button>
      </div>
    </main>
  );
}