/**
 * Pure domain types — follow-up progress records.
 */

export type ProgressRecord = {
  id: string
  taskId: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Progress percentage, 0-100. */
  value: number
  note?: string
}
