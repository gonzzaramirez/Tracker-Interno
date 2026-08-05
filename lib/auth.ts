/**
 * Session helpers — cookie management. Depends on Next.js server-only
 * APIs (cookies()), so this module is NOT imported by the DB connection layer.
 */

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export { hashPassword, verifyPassword } from "./auth-password"

// ---------------------------------------------------------------------------
// Session cookie (HMAC-signed, HttpOnly)
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "session"
const SESSION_SECRET =
  process.env.SESSION_SECRET || "tracker-dev-secret-change-in-production"

function sign(payload: string): string {
  const hmac = createHmac("sha256", SESSION_SECRET)
  hmac.update(payload)
  return `${payload}.${hmac.digest("hex")}`
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".")
  if (lastDot === -1) return null
  const payload = token.slice(0, lastDot)
  const expected = sign(payload)
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected)) ? payload : null
}

/** Store a signed session cookie for the given user id. */
export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sign(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

/** Remove the session cookie (sign-out). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

/**
 * Returns the authenticated user id, or null if no valid session exists.
 * Call this at the start of every server action and page that needs auth.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verify(token)
}
