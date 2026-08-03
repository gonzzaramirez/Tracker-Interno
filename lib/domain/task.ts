/**
 * Pure domain types — tasks assigned to members.
 */

import type { ProgressRecord } from "./progress"

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

/** Task read model with the persisted progress history. */
export type TaskWithProgress = {
  task: Task
  records: ProgressRecord[]
  currentValue: number
}
