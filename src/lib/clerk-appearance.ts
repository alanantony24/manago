import { MANAGO_NAVY, MANAGO_TEAL } from "@/lib/brand-colors"

/** Shared Clerk theme so sign-in / register match ManaGo. Keep overrides light. */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: MANAGO_TEAL,
    colorText: MANAGO_NAVY,
    colorTextSecondary: "#4b5563",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: MANAGO_NAVY,
    colorNeutral: MANAGO_NAVY,
    colorDanger: "#dc2626",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-0 bg-transparent",
    card: "w-full shadow-none border-0 bg-transparent p-0 gap-4",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-border bg-white text-manago-navy shadow-none hover:bg-muted",
    formFieldLabel: "text-sm font-medium text-manago-navy",
    formFieldInput:
      "rounded-lg border border-border bg-white text-manago-navy",
    formButtonPrimary:
      "bg-manago-teal text-white shadow-none hover:bg-manago-teal-dark",
    footer: "hidden",
    footerAction: "hidden",
  },
  layout: {
    logoPlacement: "none" as const,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
}
