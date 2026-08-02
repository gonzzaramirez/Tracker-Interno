/**
 * Pure domain types — tasks assigned to members.
 */

export const TASK_STATUSES = ["queued", "in-progress", "done"] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ["low", "medium", "high"] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export type Task = {
  id: string
  memberId: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  /** ISO date (YYYY-MM-DD). */
  dueDate?: string
  /** ISO date (YYYY-MM-DD). */
  createdAt: string
}