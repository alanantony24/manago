import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { isAdminUser } from "@/lib/admin"

/** Redirect non-admins away from admin-only pages. */
export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  if (!isAdminUser(user)) {
    redirect("/nearby")
  }

  return user
}
