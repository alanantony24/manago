export type AdminUserLike = {
  id: string
  publicMetadata?: Record<string, unknown> | null
}

/** True when Clerk public metadata has `role: "admin"`. */
export function isAdminUser(user: AdminUserLike | null | undefined): boolean {
  if (!user) return false
  return user.publicMetadata?.role === "admin"
}
