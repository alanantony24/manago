"use client"

import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs"
import { AuthShell } from "@/components/auth-shell"
import { clerkAuthAppearance } from "@/lib/clerk-appearance"

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Log in to find nearby facilities and contribute to the community."
      alternateLabel="Don't have an account?"
      alternateHref="/register"
    >
      <ClerkLoading>
        <div className="w-full space-y-3" aria-busy="true" aria-label="Loading sign in">
          <div className="h-11 w-full animate-pulse rounded-lg bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-manago-teal/40" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn
          path="/sign-in"
          routing="path"
          forceRedirectUrl="/nearby"
          fallbackRedirectUrl="/nearby"
          signUpUrl="/register"
          appearance={clerkAuthAppearance}
        />
      </ClerkLoaded>
    </AuthShell>
  )
}
