import Navbar from "../components/Navbar";


export default function Location() {
  return (

    <div>
      <Navbar></Navbar>

      <div className="bg-white rounded-2xl p-5 shadow-md m-4">
        {/* <p className="mb-4 text-xl font-bold">Facility Type</p>
        <p className="mb-4 text-red-500 text-xl  font-bold">*</p> */}

        <p className="mb-4 text-xl font-bold">
          Facility Type <span className="text-red-500 text-sm align-super">*</span>
        </p>

        <div className="flex flex-wrap gap-3">
          <button className="hover:bg-[#0B7F7F] rounded-xl border border-gray-300 px-4 py-2">
            Toilet w/ bidet
          </button>

          <button className="hover:bg-[#0B7F7F] rounded-xl border border-gray-300 px-4 py-2">
            Toilet
          </button>

          <button className="hover:bg-[#0B7F7F] rounded-xl border border-gray-300 px-4 py-2">
            Water Cooler
          </button>

          <button className="hover:bg-[#0B7F7F] rounded-xl border border-gray-300 px-4 py-2">
            Nursing Home
          </button>

          <button className="hover:bg-[#0B7F7F] rounded-xl border border-gray-300 px-4 py-2">
            Baby Changing
          </button>
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
        <p className="mb-4 text-xl font-bold">
          Opening Hours
          <button className="rounded-xl border border-gray-300 px-4 py-2 mr-5">
            24 hours
          </button>
          {/* <span className="text-red-500 text-sm align-super"></span> */}
        </p>

        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-xl"
          placeholder="Enter facility type"
        />
      </div>

      <div>
        <label className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 m-4">
          Tap to add a photo
          <input type="file" className="hidden" />
        </label>
      </div>

    </div>


  )
}