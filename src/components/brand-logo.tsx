import { cn } from "@/lib/utils"
import { ericaOne } from "@/lib/fonts"
import { ManaGoPinIcon } from "@/components/manago-pin-icon"

type BrandLogoProps = {
  className?: string
  variant?: "light" | "dark"
}

export default function BrandLogo({
  className,
  variant = "light",
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <ManaGoPinIcon className="size-7 sm:size-8 md:size-9" />
      <h1
        className={cn(
          ericaOne.className,
          "text-[1.375rem] leading-[0.95] tracking-tighter sm:text-[1.5rem] md:text-[1.75rem]"
        )}
      >
        <span
          className={
            variant === "light" ? "text-white" : "text-manago-navy"
          }
        >
          ManaGo
        </span>
        <span className="text-manago-orange">!</span>
      </h1>
    </div>
  )
}
