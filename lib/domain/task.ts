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
  /**
   * Creation timestamp. New tasks store a full ISO timestamp
   * (YYYY-MM-DDTHH:mm:ss.sssZ); tasks created before that change only have a
   * date (YYYY-MM-DD) and no wall-clock time.
   */
  createdAt: string
}
