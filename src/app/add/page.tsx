'use client';
import Navbar from "../components/Navbar";
import { useState } from "react";

export default function Location() {

  const facilities = [
    "Toilet w/ bidet",
    "Toilet",
    "Water Cooler",
    "Nursing Home",
    "Baby Changing",
  ];

  const [selected, setSelected] = useState({});

  const toggleButton = (facility : string ) => {
    setSelected((prev) => ({
      ...prev,
      [facility]: !prev[facility],
    }));
  };


  const features = [
    "Bidet",
    "Baby Changing",
    "Wheelchair Accessible",
    "Grab Bars",
    "Soap",
    "Hand Dryer",
  ];

  const [selectedFeatures, setSelectedFeatures] = useState({});

  const toggleFeature = (feature : string) => {
    setSelectedFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  return (

    <div>
      <Navbar></Navbar>

      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        <p className="mb-4 text-xl font-bold">
          Facility Type <span className="text-red-500 text-sm align-super">*</span>
        </p>

        <div className="flex flex-wrap gap-3">
          {facilities.map((facility) => (
            <button
              key={facility}
              onClick={() => toggleButton(facility)}
              className={`px-4 py-2 border rounded-xl active:bg-[#A3C793] ${selected[facility] ? "bg-white border-[#0B7F7F]"
                : "bg-white border-gray-300"
                }`}
            >
              {facility}
            </button>
          ))}
        </div>
      </div>


      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        <p className="mb-4 text-xl font-bold">
          Location <span className="text-red-500 text-sm align-super">*</span>
        </p>

        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-xl"
          placeholder="Enter facility type"
        />
      </div>


      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Opening Hours</h2>

          <button className="rounded-xl border border-gray-300 px-4 py-2">
            24 hours
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between mr-5">
          <h2 className="text-xs font-light">Opens</h2>

          <h2 className="text-xs font-light">Closes</h2>
        </div>

        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-xl"
          placeholder="Enter facility type"
        />
      </div>


      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Photo Upload</h2>
        </div>

        <label className="cursor-pointer flex flex-col items-center justify-center
                  
                  border-2 border-dashed border-gray-300
                  rounded-xl
                  hover:border-[#0B7F7F] active:bg-[#11C0C0] hover:bg-gray-50">
          <span className="text-4xl">📷</span>
          <span className="mt-2 text-gray-600">
            Tap to add a photo
          </span>

          <input type="file" className="hidden" />
        </label>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        {/* <p className="mb-4 text-xl font-bold">Facility Type</p>
        <p className="mb-4 text-red-500 text-xl  font-bold">*</p> */}

        <p className="mb-4 text-xl font-bold">
          Features
        </p>

        <div className="flex flex-wrap gap-3">
          {features.map((feature) => (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              className={`px-4 py-2 border rounded-xl ${selectedFeatures[feature]
                ? "bg-[#A3C793] border-[#0B7F7F]"
                : "bg-white border-gray-300"
                }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#CBF0ED] rounded-2xl p-5 shadow-md m-4">
        <h1 className="text-[#084F4F] px-4 py-2">Every submission is reviewed by our team before going live.</h1>
      </div>

      <div className="flex justify-center">
        <button className="bg-[#DDE8E8] text-[#5E7878]  rounded-2xl p-5 shadow-md m-4 w-30 h-15 text-center">
          Submit
        </button>
      </div>
    </div>


  )
}