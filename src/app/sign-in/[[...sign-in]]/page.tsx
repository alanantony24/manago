import { SignIn } from "@clerk/nextjs"
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
      <SignIn
        forceRedirectUrl="/nearby"
        signUpUrl="/register"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  )
}
