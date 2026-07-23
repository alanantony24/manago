import { auth, currentUser } from "@clerk/nextjs/server"
import type { User } from "@clerk/nextjs/server"

/** True when both Clerk server env vars are present. */
export function isClerkConfigured() {
  return (
    Boolean(process.env.CLERK_SECRET_KEY) &&
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  )
}

/**
 * Safe wrappers for pages that must render even when Clerk middleware
 * did not run (e.g. missing keys, or a static-asset 404 path).
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isClerkConfigured()) return null
  try {
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}

export async function getCurrentUserSafe(): Promise<User | null> {
  if (!isClerkConfigured()) return null
  try {
    return await currentUser()
  } catch {
    return null
  }
}
