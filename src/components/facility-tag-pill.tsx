import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FacilityTagPillProps = {
  children: ReactNode
  className?: string
}

export function FacilityTagPill({ children, className }: FacilityTagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-manago-orange/50 bg-manago-orange/10 px-2.5 py-0.5 text-xs font-semibold text-manago-navy",
        className
      )}
    >
      {children}
    </span>
  )
}
