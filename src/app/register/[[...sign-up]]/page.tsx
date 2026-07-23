"use client"

import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs"
import { AuthShell } from "@/components/auth-shell"
import { clerkAuthAppearance } from "@/lib/clerk-appearance"

export default function RegisterPage() {
  return (
    <AuthShell
      title="Register"
      subtitle="Join ManaGo to add facilities and unlock community features."
      alternateLabel="Already have an account?"
      alternateHref="/sign-in"
    >
      <ClerkLoading>
        <div className="w-full space-y-3" aria-busy="true" aria-label="Loading register">
          <div className="h-11 w-full animate-pulse rounded-lg bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-manago-teal/40" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp
          path="/register"
          routing="path"
          forceRedirectUrl="/nearby"
          fallbackRedirectUrl="/nearby"
          signInUrl="/sign-in"
          appearance={clerkAuthAppearance}
        />
      </ClerkLoaded>
    </AuthShell>
  )
}
