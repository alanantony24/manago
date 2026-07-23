import { AppPageHeader } from "@/components/app-page-header"

const SECTIONS = [
  {
    title: "Finding amenities",
    items: [
      {
        label: "Home",
        body: "Browse nearby water coolers, toilets with bidets, and nursing rooms on the map and in the list.",
      },
      {
        label: "Filters and search",
        body: "Use the amenity chips or search box to narrow results by type, name, or address.",
      },
      {
        label: "Locate",
        body: "Open Locate (or tap Navigate on a facility) for walking, cycling, or driving directions.",
      },
    ],
  },
  {
    title: "Contributing",
    items: [
      {
        label: "Contribute",
        body: "Signed-in users can submit a new facility with a photo and details. Submissions are reviewed before they go live.",
      },
      {
        label: "Review",
        body: "Open any facility and tap Review to leave a star rating, tags, and an optional comment.",
      },
      {
        label: "Profile",
        body: "Your profile shows your display name, join date, and activity (reviews written and places contributed).",
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
        body: "Check the data-quality note on the facility page. Some imported places may miss addresses or details even when the pin is accurate.",
      },
      {
        label: "How do I get directions?",
        body: "Open a facility and tap Navigate, or use Locate for turn-by-turn guidance.",
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppPageHeader />
      <div className="mx-auto max-w-lg px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight text-manago-navy">
          How ManaGo works
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ManaGo helps you find public amenities around Singapore. Use this
          page if you need a quick overview of Home, Contribute, Reviews, or
          location permission.
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-lg font-semibold tracking-tight text-manago-navy">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-4">
                {section.items.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <p className="font-semibold text-manago-navy">{item.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
