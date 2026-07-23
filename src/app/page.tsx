import { redirect } from "next/navigation"
import { getAuthUserId } from "@/lib/clerk-server"

export default async function Home() {
  const userId = await getAuthUserId()
  redirect(userId ? "/nearby" : "/sign-in")
}
