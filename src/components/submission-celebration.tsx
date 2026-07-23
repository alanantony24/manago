"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Check } from "lucide-react";
import { Link } from "next-view-transitions";
import {
  MANAGO_BRAND_ORANGE,
  MANAGO_CHIP,
  MANAGO_MINT,
  MANAGO_NAVY,
  MANAGO_TEAL,
  MANAGO_TEAL_DARK,
} from "@/lib/brand-colors";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = [
  MANAGO_TEAL,
  MANAGO_TEAL_DARK,
  MANAGO_MINT,
  MANAGO_CHIP,
  MANAGO_BRAND_ORANGE,
  MANAGO_NAVY,
  "#FFFFFF",
];

type SubmissionCelebrationProps = {
  onAddAnother: () => void;
  className?: string;
};

function fireBurst(origin: { x: number; y: number }, particleCount: number) {
  confetti({
    particleCount,
    spread: 70,
    startVelocity: 38,
    origin,
    colors: CONFETTI_COLORS,
    ticks: 220,
    gravity: 0.95,
    scalar: 0.95,
    disableForReducedMotion: true,
  });
}

function fireSideCannons() {
  const end = Date.now() + 1400;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: CONFETTI_COLORS,
      ticks: 200,
      scalar: 0.9,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: CONFETTI_COLORS,
      ticks: 200,
      scalar: 0.9,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function SubmissionCelebration({
  onAddAnother,
  className,
}: SubmissionCelebrationProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    fireBurst({ x: 0.5, y: 0.4 }, 90);

    const t1 = window.setTimeout(() => {
      fireBurst({ x: 0.28, y: 0.35 }, 55);
      fireBurst({ x: 0.72, y: 0.35 }, 55);
    }, 280);

    const t2 = window.setTimeout(() => {
      fireSideCannons();
    }, 520);

    const t3 = window.setTimeout(() => {
      fireBurst({ x: 0.5, y: 0.28 }, 45);
    }, 1100);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <main
      className={cn(
        "relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,color-mix(in_srgb,var(--color-manago-mint)_55%,transparent),transparent_55%),radial-gradient(ellipse_at_80%_70%,color-mix(in_srgb,var(--color-manago-notice)_70%,transparent),transparent_50%),radial-gradient(ellipse_at_15%_85%,color-mix(in_srgb,var(--color-manago-chip)_35%,transparent),transparent_45%)]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-20">
        <div className="celebration-pop flex flex-col items-center text-center">
          <div className="celebration-check relative mb-7 flex size-24 items-center justify-center rounded-full bg-manago-teal-dark shadow-[0_12px_40px_-8px_color-mix(in_srgb,var(--color-manago-teal-dark)_55%,transparent)]">
            <span
              className="celebration-ring absolute inset-0 rounded-full border-2 border-manago-teal/40"
              aria-hidden
            />
            <Check
              className="size-12 text-white"
              strokeWidth={2.75}
              aria-hidden
            />
          </div>

          <p className="font-heading text-4xl tracking-wide text-manago-teal-dark sm:text-5xl">
            Thank you!
          </p>

          <h1 className="mt-3 max-w-sm text-xl font-semibold leading-snug text-manago-navy sm:text-2xl">
            Your contribution helps Singaporeans find what they need.
          </h1>

          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            We appreciate you taking the time to add this facility.
          </p>

          <div className="mt-8 w-full max-w-sm rounded-2xl bg-manago-notice px-5 py-4">
            <p className="text-sm font-medium leading-relaxed text-manago-notice-text">
              Your submission is now with our team for review. Once approved,
              it will appear on the map for everyone.
            </p>
          </div>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={onAddAnother}
              className="rounded-2xl bg-manago-teal-dark px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-manago-teal"
            >
              Add another facility
            </button>
            <Link
              href="/nearby"
              className="rounded-2xl border border-border bg-white px-8 py-3.5 text-center text-base font-medium text-manago-navy transition-colors hover:border-manago-teal hover:bg-manago-mint/40"
            >
              Explore nearby
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
