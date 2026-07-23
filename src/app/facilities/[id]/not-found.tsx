import { Link } from "next-view-transitions"

export default function FacilityNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-background px-4 py-16 text-foreground">
      <h1 className="text-xl font-bold text-manago-navy">Facility not found</h1>
      <p className="text-sm text-muted-foreground">
        This facility may have been removed or the link is incorrect.
      </p>
      <Link
        href="/nearby"
        className="rounded-lg bg-manago-teal px-4 py-2 text-sm font-medium text-white hover:bg-manago-teal-dark"
      >
        Back to nearby
      </Link>
    </div>
  )
}
