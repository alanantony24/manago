import { SignUp } from "@clerk/nextjs"
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
      <SignUp
        forceRedirectUrl="/nearby"
        signInUrl="/sign-in"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  )
}
