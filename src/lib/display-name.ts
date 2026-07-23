/** Build a stored display name from Clerk user fields. Blank if none given. */
export function displayNameFromClerk(user: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
} | null | undefined): string {
  const full = user?.fullName?.trim()
  if (full) return full

  const parts = [user?.firstName, user?.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim())
    .join(" ")

  return parts
}
