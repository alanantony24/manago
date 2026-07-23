import type { ReactNode } from "react"
import { Link } from "next-view-transitions"
import BrandLogo from "@/components/brand-logo"
import { AuthFormEnterSubmit } from "@/components/auth-form-enter-submit"

type AuthShellProps = {
  title: string
  subtitle: string
  alternateLabel: string
  alternateHref: string
  children: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  alternateLabel,
  alternateHref,
  children,
}: AuthShellProps) {
  return (
    <div className="auth-shell relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-manago-navy p-5 sm:p-8">
      {/* Floating Singapore map — oversized so it can drift diagonally */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="auth-map-drift absolute -left-[10%] -top-[10%] h-[125%] w-[140%]">
          <iframe
            className="h-full w-full scale-[1.02] opacity-55 contrast-110 saturate-[0.85]"
            src="https://www.openstreetmap.org/export/embed.html?bbox=103.8200%2C1.2700%2C103.9000%2C1.3300&amp;layer=mapnik"
            style={{ border: 0 }}
            title="Singapore Map Preview"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-manago-navy/88 via-manago-teal/72 to-manago-navy/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(212,232,208,0.18),transparent_55%)]" />
      </div>

      <div className="auth-shell-card relative z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-[1.25rem] border border-white/40 bg-manago-mint/95 px-5 py-7 shadow-[0_20px_50px_-20px_rgba(26,77,89,0.55)] backdrop-blur-md sm:gap-6 sm:px-8 sm:py-9">
        <BrandLogo variant="dark" className="justify-center scale-110" />

        <div className="w-full text-center">
          <h1 className="font-heading text-3xl tracking-tight text-manago-navy sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-manago-navy/70">
            {subtitle}
          </p>
        </div>

        <div className="w-full">
          <AuthFormEnterSubmit>{children}</AuthFormEnterSubmit>
        </div>

        <p className="text-sm text-manago-navy/80">
          {alternateLabel}{" "}
          <Link
            href={alternateHref}
            className="font-semibold text-manago-teal underline underline-offset-4 hover:text-manago-teal-dark"
          >
            {alternateHref === "/sign-in" ? "Sign in" : "Register"}
          </Link>
        </p>
      </div>
    </div>
  )
}
