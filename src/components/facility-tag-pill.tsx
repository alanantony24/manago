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
        "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800",
        className
      )}
    >
      {children}
    </span>
  )
}
