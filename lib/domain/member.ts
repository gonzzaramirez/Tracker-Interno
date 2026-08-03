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
  notes?: string
  /** Number of days between scheduled check-ins. */
  checkinFreqDays: number
  /** ISO date of the last completed check-in, if any. */
  lastCheckinAt?: string
  /** ISO date when the next check-in becomes due. */
  nextCheckinAt: string
}
