import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import BrandLogo from "@/components/brand-logo"
import { MenuToggle } from "@/components/nav-menu"
import { MANAGO_TEAL } from "@/lib/brand-colors"

type AppPageHeaderProps = {
  children?: ReactNode
  className?: string
  subtitle?: string
}

export function AppPageHeader({
  children,
  className,
  subtitle,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-b-[1.25rem] px-4 pb-6 pt-5 sm:gap-3 sm:rounded-b-3xl sm:pb-7 sm:pt-6",
        className
      )}
      style={{ backgroundColor: MANAGO_TEAL }}
    >
      <div className="flex items-center justify-between">
        <MenuToggle variant="onDark" />
        <div className="flex flex-col items-center">
          <BrandLogo />
          {subtitle ? (
            <p className="mt-0.5 text-xs font-medium text-white/80 sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="size-10 shrink-0" aria-hidden />
      </div>
      {children}
    </header>
  )
}
