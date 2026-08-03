/**
 * Pure domain types — follow-up progress records.
 */

export type ProgressRecord = {
  id: string
  taskId: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** ISO timestamp used to order records created on the same date. */
  createdAt: string
  /** Persistent insertion sequence used as the final stable tie-breaker. */
  createdSequence: number
  /** Progress percentage, 0-100. */
  value: number
  note?: string
}
