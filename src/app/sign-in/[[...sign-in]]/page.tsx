import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

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
        appearance={{
          elements: {
            headerTitle: "text-lg font-semibold text-slate-800 tracking-tight",
            headerSubtitle: "text-xs text-slate-500",
            card: "shadow-xl border border-slate-100",
          },
        }}
      />
    </AuthShell>
  );
}
