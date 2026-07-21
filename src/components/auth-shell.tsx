import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  alternateLabel: string;
  alternateHref: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  alternateLabel,
  alternateHref,
  children,
}: AuthShellProps) {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-900">
      <div className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 bg-slate-900">
        <iframe
          className="pointer-events-none h-full w-full opacity-40 contrast-125 grayscale invert"
          src="https://www.openstreetmap.org/export/embed.html?bbox=103.8400%2C1.2900%2C103.8600%2C1.3050&amp;layer=mapnik"
          style={{ border: 0 }}
          title="Singapore Map Preview"
        />
      </div>

      <div className="z-10 flex h-full w-full items-center justify-center bg-transparent p-6 md:absolute md:top-0 md:right-0 md:bottom-0 md:w-1/2 md:bg-[#82C4D1]">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <Image src="/logo.png" alt="Manago Logo" width={220} height={220} />

          <div className="w-full text-center">
            <h1 className="font-heading text-4xl tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-700">{subtitle}</p>
          </div>

          <div className="w-full">{children}</div>

          <p className="text-sm text-slate-800">
            {alternateLabel}{" "}
            <Link
              href={alternateHref}
              className="font-semibold text-slate-900 underline underline-offset-4 hover:text-white"
            >
              {alternateHref === "/sign-in" ? "Sign in" : "Register"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
