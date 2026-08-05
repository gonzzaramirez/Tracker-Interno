/**
 * Pure domain types — team member entity.
 * No Next.js or I/O dependencies on purpose (REQ-CC-001).
 */

export const MEMBER_STATUSES = ["active", "recess"] as const

export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export type Member = {
  id: string
  name: string
  role: string
  status: MemberStatus
  /** ISO date (YYYY-MM-DD). */
  joinedAt: string
  /** Hex color used for the avatar dot (optional). */
  displayColor?: string
  notes?: string
}
