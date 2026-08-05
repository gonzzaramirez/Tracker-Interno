/**
 * Password hashing helpers — pure Node.js, zero Next.js dependencies.
 * Safe to import anywhere, including the connection bootstrapper.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const SCRYPT_KEYLEN = 64

/** Returns a `salt:hash` string, suitable for storage in the `users` table. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex")
  return `${salt}:${hash}`
}

/** Constant-time comparison of a plaintext password against a stored hash. */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) return false
  const computed = scryptSync(password, salt, SCRYPT_KEYLEN)
  return timingSafeEqual(computed, Buffer.from(hash, "hex"))
}
