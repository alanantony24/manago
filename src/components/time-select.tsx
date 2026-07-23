"use client"

import { cn } from "@/lib/utils"

type TimeSelectProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/** Native time input styled to match the contribute form. */
export function TimeSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className,
}: TimeSelectProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium text-manago-navy outline-none",
          "focus:border-manago-teal-dark focus:ring-2 focus:ring-manago-teal/30",
          disabled
            ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
            : "border-border"
        )}
      />
    </div>
  )
}
