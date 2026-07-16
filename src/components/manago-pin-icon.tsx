import { cn } from "@/lib/utils"
import { MANAGO_BRAND_ORANGE } from "@/lib/brand-colors"

export { MANAGO_BRAND_ORANGE }

export function ManaGoPinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 size-10", className)}
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" fill={MANAGO_BRAND_ORANGE} />
      <path
        d="M24 11c-4.2 0-7.5 3.3-7.5 7.5 0 5.6 7.5 14.5 7.5 14.5s7.5-8.9 7.5-14.5C31.5 14.3 28.2 11 24 11z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
