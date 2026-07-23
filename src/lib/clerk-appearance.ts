import { MANAGO_NAVY, MANAGO_TEAL } from "@/lib/brand-colors"

/** Shared Clerk theme so sign-in / register match ManaGo. */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: MANAGO_TEAL,
    colorText: MANAGO_NAVY,
    colorTextSecondary: "#4b5563",
    colorBackground: "transparent",
    colorInputBackground: "#ffffff",
    colorInputText: MANAGO_NAVY,
    colorNeutral: MANAGO_NAVY,
    colorDanger: "#dc2626",
    // Avoid Clerk’s thick focus halo (clips oddly against the mint panel).
    colorRing: "transparent",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
  },
  elements: {
    // Clerk’s own CSS beats Tailwind `w-full`; set width via style object too.
    rootBox: {
      width: "100%",
      maxWidth: "100%",
    },
    // Flatten Clerk’s default card chrome so AuthShell is the only panel.
    cardBox: {
      width: "100%",
      maxWidth: "100%",
      boxShadow: "none",
      border: "none",
      background: "transparent",
      // Default overflow:hidden clips the input focus ring on the sides.
      overflow: "visible",
    },
    card: {
      width: "100%",
      maxWidth: "100%",
      background: "transparent",
      boxShadow: "none",
      border: "none",
      padding: "0",
      gap: "1rem",
      overflow: "visible",
    },
    scrollBox: {
      width: "100%",
      background: "transparent",
      overflow: "visible",
    },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    main: "gap-4",
    socialButtons: "w-full",
    socialButtonsBlockButton:
      "border border-border bg-white text-manago-navy shadow-none hover:bg-muted",
    socialButtonsBlockButtonText: "font-medium text-manago-navy",
    dividerLine: "bg-border",
    dividerText: "text-xs text-muted-foreground",
    formFieldLabel: "text-sm font-medium text-manago-navy",
    // Border-only focus — no ring/shadow (those get clipped and look uneven).
    formFieldInput:
      "rounded-lg border-border bg-white text-manago-navy shadow-none outline-none placeholder:text-muted-foreground focus:border-manago-teal focus:shadow-none focus:outline-none focus:ring-0",
    formButtonPrimary:
      "bg-manago-teal text-white shadow-none hover:bg-manago-teal-dark",
    footerActionLink: "font-semibold text-manago-teal hover:text-manago-teal-dark",
    identityPreviewText: "text-manago-navy",
    identityPreviewEditButton: "text-manago-teal hover:text-manago-teal-dark",
    formFieldSuccessText: "text-manago-teal",
    alertText: "text-sm",
    // AuthShell already shows the sign-in ↔ register switch.
    footer: { display: "none" },
    footerAction: { display: "none" },
  },
  layout: {
    logoPlacement: "none" as const,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
}
