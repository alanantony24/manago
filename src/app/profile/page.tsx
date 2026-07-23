"use client"

import { useEffect, useState } from "react"
import { Link } from "next-view-transitions"
import { useUser } from "@clerk/nextjs"
import { LogOut } from "lucide-react"
import {
  syncProfileAndGetActivity,
  type ProfileDashboard,
} from "@/app/actions/profile"
import { AppPageHeader } from "@/components/app-page-header"
import { Button } from "@/components/ui/button"

/** Format a Date as a long locale date string, or "—" when missing. */
function formatJoinedDate(date: Date | null | undefined) {
  if (!date) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Two-letter (or one-letter) initials from a display name. */
function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

/** Signed-in user profile with activity counts from Supabase. */
export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)

  useEffect(() => {
    if (isLoaded) return
    const timer = window.setTimeout(() => setLoadTimedOut(true), 8000)
    return () => window.clearTimeout(timer)
  }, [isLoaded])

  const showLoading = !isLoaded && !loadTimedOut
  const showAuthStuck = !isLoaded && loadTimedOut

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    let cancelled = false

    void Promise.resolve().then(async () => {
      if (cancelled) return
      setActivityLoading(true)
      try {
        const result = await syncProfileAndGetActivity()
        if (!cancelled) setDashboard(result)
      } catch (error) {
        console.error("Failed to load profile activity:", error)
        if (!cancelled) setDashboard(null)
      } finally {
        if (!cancelled) setActivityLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn])

  const activeDashboard = isSignedIn ? dashboard : null
  const displayName = activeDashboard?.profile.display_name?.trim() || ""
  const email = user?.primaryEmailAddress?.emailAddress
  const imageUrl = user?.imageUrl
  const joinedLabel = formatJoinedDate(user?.createdAt)

  const activityStats = [
    {
      label: "Reviews written",
      value: activityLoading
        ? "…"
        : String(activeDashboard?.activity.reviewsWritten ?? 0),
    },
    {
      label: "Facilities contributed",
      value: activityLoading
        ? "…"
        : String(activeDashboard?.activity.facilitiesContributed ?? 0),
    },
    {
      label: "Places verified",
      value: activityLoading
        ? "…"
        : String(activeDashboard?.activity.placesVerified ?? 0),
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppPageHeader />
      <div className="mx-auto max-w-lg px-6 py-10">
        {showLoading ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="size-16 animate-pulse rounded-full bg-muted"
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-7 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          </section>
        ) : showAuthStuck ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-manago-navy">
              Account unavailable
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Auth did not finish loading. If this keeps happening, turn off
              Vercel Deployment Protection and add your Vercel domain in the
              Clerk dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link href="/sign-in">Try sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link href="/sign-out">Force log out</Link>
              </Button>
            </div>
          </section>
        ) : !isSignedIn || !user ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="flex size-16 items-center justify-center rounded-full bg-manago-navy text-xl font-bold text-white"
                aria-hidden
              >
                ?
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-manago-navy">
                  Your profile
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to see your account details.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Clerk CDN avatars; avoid next/image remote config
                  <img
                    src={imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-16 items-center justify-center rounded-full bg-manago-navy text-xl font-bold text-white"
                    aria-hidden
                  >
                    {initialsFromName(displayName)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight text-manago-navy">
                    Your profile
                  </h2>
                  {email ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {email}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Signed in to ManaGo
                    </p>
                  )}
                </div>
              </div>

              <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
                {displayName ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Display name</dt>
                    <dd className="truncate font-medium text-manago-navy">
                      {displayName}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Date joined</dt>
                  <dd className="font-medium text-manago-navy">{joinedLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Account status</dt>
                  <dd className="font-medium text-manago-navy">Active</dd>
                </div>
              </dl>
            </section>

            <section className="mt-6">
              <h3 className="text-lg font-semibold tracking-tight text-manago-navy">
                Activity
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {activityStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm"
                  >
                    <p className="text-2xl font-bold text-manago-navy">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Button
              asChild
              size="lg"
              className="mt-6 h-12 w-full gap-2 rounded-xl border border-destructive/30 bg-red-50 text-red-700 hover:border-destructive/50 hover:bg-red-100 hover:text-red-800"
            >
              <Link href="/sign-out">
                <LogOut aria-hidden />
                Log out
              </Link>
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
