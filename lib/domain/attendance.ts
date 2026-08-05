/**
 * Pure domain types — daily attendance.
 *
 * One row per member per day: presence is recorded explicitly (who showed up
 * and is active); absence is the lack of a row.
 */

export type Attendance = {
  id: string
  memberId: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Wall-clock time (HH:MM) when the mark was made; null for pre-migration rows. */
  markedAt: string | null
  /** ISO date (YYYY-MM-DD) when the mark was created. */
  createdAt: string
}
