import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

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
