import { getCurrentUserId } from "./auth"
import { getUserById } from "@/lib/db/repos/users"
import { redirect } from "next/navigation"

/** Returns the authenticated user id, or redirects to /login. */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/login")
  return userId
}

/**
 * Returns the current user id only when the session belongs to the PM
 * account, otherwise redirects to "/" (supervisors never reach /pm).
 */
export async function requirePm(): Promise<string> {
  const userId = await requireAuth()
  const user = await getUserById(userId)
  if (!user || user.role !== "pm") redirect("/")
  return userId
}
