import Link from "next/link"

export default function FacilityNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-xl font-bold">Facility not found</h1>
      <p className="text-sm text-gray-500">
        This facility may have been removed or the link is incorrect.
      </p>
      <Link
        href="/nearby"
        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
      >
        Back to nearby
      </Link>
    </div>
  )
}
