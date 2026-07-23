import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import BrandLogo from "@/components/brand-logo"
import { MenuToggle } from "@/components/nav-menu"

type AppPageHeaderProps = {
  children?: ReactNode
  className?: string
}

export function AppPageHeader({ children, className }: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-b-[1.25rem] bg-manago-teal px-4 pb-6 pt-5 sm:gap-3 sm:rounded-b-3xl sm:pb-7 sm:pt-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <MenuToggle variant="onDark" />
        <BrandLogo />
        <div className="size-10 shrink-0" aria-hidden />
      </div>
      {children}
    </header>
  )
}
