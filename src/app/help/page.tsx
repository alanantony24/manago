import { AppPageHeader } from "@/components/app-page-header"
import { MANAGO_NAVY } from "@/lib/brand-colors"

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AppPageHeader subtitle="Help" />
      <div className="mx-auto max-w-lg px-6 py-10">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: MANAGO_NAVY }}
        >
          How ManaGo works
        </h2>
        <ul className="mt-6 space-y-4 text-gray-700">
          <li>
            <strong className="text-gray-900">Home</strong> — find nearby
            water coolers, restrooms, and nursing rooms on the map.
          </li>
          <li>
            <strong className="text-gray-900">Contribute</strong> — add a new
            facility to help the community.
          </li>
          <li>
            <strong className="text-gray-900">Review</strong> — share your
            experience at facilities you visit.
          </li>
        </ul>
      </div>
    </main>
  )
}
