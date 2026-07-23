"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Clerk’s auth UI sometimes ignores Enter in text fields. Wire Enter to the
 * primary submit button inside the auth shell.
 */
export function AuthFormEnterSubmit({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return

      const target = event.target
      if (!(target instanceof HTMLInputElement)) return

      const container = rootRef.current
      if (!container) return

      const form = target.closest("form")
      if (!form || !container.contains(form)) return

      const submitBtn = form.querySelector<HTMLButtonElement>(
        "button.cl-formButtonPrimary, button[data-localization-key='formButtonPrimary'], button[type='submit']"
      )
      if (!submitBtn || submitBtn.disabled || submitBtn.getAttribute("aria-disabled") === "true") {
        return
      }

      event.preventDefault()
      submitBtn.click()
    }

    // Capture on the wrapper so we run before Clerk’s input handlers.
    root.addEventListener("keydown", onKeyDown, true)
    return () => root.removeEventListener("keydown", onKeyDown, true)
  }, [])

  return (
    <div ref={rootRef} data-auth-enter-submit="true">
      {children}
    </div>
  )
}
