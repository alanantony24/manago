import { AppPageHeader } from "@/components/app-page-header"
import { MANAGO_NAVY } from "@/lib/brand-colors"

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AppPageHeader subtitle="Review" />
      <div className="mx-auto max-w-lg px-6 py-10 text-center">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: MANAGO_NAVY }}
        >
          Reviews coming soon
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-600">
          Browse facilities on Home or Locate for now. Review writing will open
          after the reviews feature is finished, and facility pages already
          show an honest empty state instead of placeholder ratings.
        </p>
      </div>
    </main>
  )
}
