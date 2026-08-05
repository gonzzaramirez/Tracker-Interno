import { getCurrentUserId } from "./auth"
import { redirect } from "next/navigation"

/** Returns the authenticated user id, or redirects to /login. */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/login")
  return userId
}
