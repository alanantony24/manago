import { AppPageHeader } from "@/components/app-page-header"
import { MANAGO_NAVY } from "@/lib/brand-colors"

const STAT_PLACEHOLDERS = [
  { label: "Reviews written", value: "—" },
  { label: "Facilities contributed", value: "—" },
  { label: "Places verified", value: "—" },
]

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AppPageHeader subtitle="Profile" />
      <div className="mx-auto max-w-lg px-6 py-10">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="flex size-16 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: MANAGO_NAVY }}
              aria-hidden
            >
              ?
            </div>
            <div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: MANAGO_NAVY }}
              >
                Your profile
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Sign in to see your account details.
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Display name</dt>
              <dd className="font-medium text-gray-900">Not signed in</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Date joined</dt>
              <dd className="font-medium text-gray-900">—</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Account status</dt>
              <dd className="font-medium text-gray-900">Waiting for auth</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6">
          <h3
            className="text-lg font-semibold tracking-tight"
            style={{ color: MANAGO_NAVY }}
          >
            Activity
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STAT_PLACEHOLDERS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-manago-navy">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {/* TODO(auth): replace placeholders with Clerk user profile fields
                and live counts from reviews / contributions once those
                features ship. */}
            These stats will fill in after authentication and reviews are
            connected.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Next step for the team</p>
          <p className="mt-2 leading-relaxed">
            Once the auth branch is ready, wire this page to the signed-in
            Clerk user (name, avatar, created date) and keep the layout above.
          </p>
        </section>
      </div>
    </main>
  )
}
