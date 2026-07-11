import { cn } from "@/lib/utils"
import { ericaOne } from "@/lib/fonts"
import {
  MANAGO_BRAND_ORANGE,
  ManaGoPinIcon,
} from "@/components/manago-pin-icon"

type BrandLogoProps = {
  className?: string
}

export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <ManaGoPinIcon className="size-7 sm:size-8 md:size-9" />
      <h1
        className={cn(
          ericaOne.className,
          "text-[1.375rem] leading-[0.95] tracking-tighter sm:text-[1.5rem] md:text-[1.75rem]"
        )}
      >
        <span className="text-white">ManaGo</span>
        <span style={{ color: MANAGO_BRAND_ORANGE }}>!</span>
      </h1>
    </div>
  )
}
