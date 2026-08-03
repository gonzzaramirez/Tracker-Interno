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

/** Read model used by the existing task list and member timeline. */
export type TimelineEntry = {
  id: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  taskId: string
  taskTitle: string
  /** Progress value 0-100. */
  value: number
  note?: string
}
