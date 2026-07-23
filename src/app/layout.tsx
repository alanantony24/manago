import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ericaOne, plusJakarta } from "@/lib/fonts";
import { AuthRedirectFix } from "@/components/auth-redirect-fix";
import { NavMenuProvider } from "@/components/nav-menu";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ManaGo!",
  description: "Find nearby water coolers, restrooms, and nursing rooms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`light h-full font-sans antialiased ${plusJakarta.variable} ${ericaOne.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/register"
          signInForceRedirectUrl="/nearby"
          signUpForceRedirectUrl="/nearby"
          afterSignOutUrl="/sign-in"
        >
          <AuthRedirectFix />
          <ViewTransitions>
            <NavMenuProvider>{children}</NavMenuProvider>
            <Toaster />
          </ViewTransitions>
        </ClerkProvider>
      </body>
    </html>
  );
}
