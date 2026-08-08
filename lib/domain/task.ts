/**
 * Pure domain types — informational tasks.
 *
 * Tasks are NOT assigned to anyone: they exist only as a shared reference
 * list (title + description) so the owner can consult them while recording
 * follow-ups. Progress is captured per tracking record, not per task.
 */

export type Task = {
  id: string
  /** Tenant owner (supervisor). */
  userId: string
  title: string
  description?: string
  /**
   * Optional public Google Sheets URL linked to this task. When present, a
   * cron imports the sheet's rows (TASK_STATUS 'done') into task_daily_stats
   * and the task has a detail view with per-member counts and breakdown.
   */
  sheetUrl?: string | null
  /** Last time the linked sheet was imported by the sync (ISO). */
  lastSyncedAt?: string | null
  /**
   * Message of the last failed sheet sync, shown by the UI (badge + alert).
   * Cleared automatically on the next successful sync.
   */
  lastSyncError?: string | null
  /**
   * Wall-clock date when the task was marked done, stored as YYYY-MM-DD
   * (Argentina time). Absent while the task is not completed.
   */
  completedAt?: string
  /**
   * Creation timestamp. New tasks store a full ISO timestamp
   * (YYYY-MM-DDTHH:mm:ss.sssZ); tasks created before that change only have a
   * date (YYYY-MM-DD) and no wall-clock time.
   */
  createdAt: string
}
