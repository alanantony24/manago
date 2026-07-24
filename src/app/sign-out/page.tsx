"use client"

import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

/** Hard sign-out route so logout works even if the profile page fails to mount. */
export default function SignOutPage() {
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        // Prefer an absolute app URL so Clerk does not bounce to Account Portal.
        await signOut({ redirectUrl: `${window.location.origin}/sign-in` })
        if (!cancelled) window.location.assign("/sign-in")
      } catch (error) {
        console.error("Sign out failed:", error)
        if (!cancelled) router.replace("/sign-in")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [signOut, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Signing you out…</p>
    </main>
  )
}
