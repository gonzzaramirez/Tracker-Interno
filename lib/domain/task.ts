/**
 * Pure domain types — informational tasks.
 *
 * Tasks are NOT assigned to anyone: they exist only as a shared reference
 * list (title + description) so the owner can consult them while recording
 * follow-ups. Progress is captured per tracking record, not per task.
 */

export type Task = {
  id: string
  title: string
  description?: string
  /** ISO date (YYYY-MM-DD). */
  createdAt: string
}
