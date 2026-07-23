"use client"

import type { CSSProperties } from "react"
import { Toaster as SonnerToaster, type ToasterProps } from "sonner"
import {
  MANAGO_NAVY,
  MANAGO_TEAL,
  MANAGO_TEAL_DARK,
} from "@/lib/brand-colors"

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-center"
      gap={10}
      offset={24}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-card text-card-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          default:
            "border-manago-teal/20 bg-manago-mint/35 text-manago-navy [&_[data-icon]]:text-manago-teal",
          info:
            "border-manago-teal/25 bg-manago-notice/60 text-manago-navy [&_[data-icon]]:text-manago-teal",
          success:
            "border-manago-teal/30 bg-manago-mint/45 text-manago-teal-dark [&_[data-icon]]:text-manago-teal-dark",
          error:
            "border-red-200 bg-red-50 text-red-800 [&_[data-icon]]:text-red-600",
          actionButton: "bg-manago-teal text-white",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "#f3fbfa",
          "--normal-text": MANAGO_NAVY,
          "--normal-border": "rgba(0, 121, 121, 0.18)",
          "--success-bg": "#f2fbf8",
          "--success-text": MANAGO_TEAL_DARK,
          "--success-border": MANAGO_TEAL,
          "--error-bg": "#fef2f2",
          "--error-text": "#991b1b",
          "--error-border": "#fecaca",
        } as CSSProperties
      }
      {...props}
    />
  )
}
