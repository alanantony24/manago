import { AppPageHeader } from "@/components/app-page-header"
import { MANAGO_NAVY } from "@/lib/brand-colors"

const SECTIONS = [
  {
    title: "Finding amenities",
    items: [
      {
        label: "Home",
        body: "Browse nearby water coolers, toilets with bidets, and nursing rooms on the map and in the list.",
      },
      {
        label: "Locate",
        body: "Turn on location access to get walking directions to the nearest verified amenity.",
      },
      {
        label: "Filters and search",
        body: "Use the amenity chips or search box to narrow results by type, name, or address.",
      },
    ],
  },
  {
    title: "Contributing",
    items: [
      {
        label: "Contribute",
        body: "Facility submissions are temporarily closed while account security is finished. The form will reopen after sign-in is ready.",
      },
      {
        label: "Review",
        body: "Community reviews are still being built. Facility pages currently show an honest empty state instead of placeholder ratings.",
      },
      {
        label: "Profile",
        body: "Your profile page is ready for display once authentication lands. It will show your name, join date, and activity stats.",
      },
    ],
  },
  {
    title: "Common questions",
    items: [
      {
        label: "Why does ManaGo ask for location?",
        body: "Location is used only in your browser to sort nearby results and guide you. It is not stored by ManaGo.",
      },
      {
        label: "A place looks wrong. What should I do?",
        body: "Check the data-quality note on the facility page. Incomplete OSM imports may miss addresses or details even when the pin is accurate.",
      },
      {
        label: "How do I get directions?",
        body: "Open a facility and tap Navigate, or use Locate for walking directions to the nearest verified amenity.",
      },
    ],
  },
]

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
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          ManaGo helps you find public amenities around Singapore. Use this
          page if you are unsure about location permission, filters, or which
          features are still being finished.
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3
                className="text-lg font-semibold tracking-tight"
                style={{ color: MANAGO_NAVY }}
              >
                {section.title}
              </h3>
              <ul className="mt-4 space-y-4">
                {section.items.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
