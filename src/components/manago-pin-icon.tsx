import { cn } from "@/lib/utils"

export const MANAGO_BRAND_ORANGE = "#F39C12"
export const MANAGO_BRAND_TEAL = "#007979"

/** White map pin silhouette inside the brand circle, viewBox 0 0 48 48 */
export const MANAGO_PIN_SILHOUETTE_PATH =
  "M24 11c-4.2 0-7.5 3.3-7.5 7.5 0 5.6 7.5 14.5 7.5 14.5s7.5-8.9 7.5-14.5C31.5 14.3 28.2 11 24 11z"

type ManaGoPinIconProps = {
  size?: number
  className?: string
  decorative?: boolean
  label?: string
}

export function ManaGoPinIcon({
  size,
  className,
  decorative = true,
  label = "ManaGo",
}: ManaGoPinIconProps) {
  return (
    <svg
      {...(size ? { width: size, height: size } : {})}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", !size && "size-10", className)}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
    >
      <circle cx="24" cy="24" r="24" fill={MANAGO_BRAND_ORANGE} />
      <path d={MANAGO_PIN_SILHOUETTE_PATH} fill="#FFFFFF" />
    </svg>
  )
}
