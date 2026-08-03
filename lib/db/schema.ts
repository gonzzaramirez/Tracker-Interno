/**
 * SQLite schema mirror (task 1.3) — single source of truth for table row
 * shapes and the CHECK-constraint enums shared by the SQL migration and the
 * repos. Strict-compatible, no Next.js dependency.
 *
 * Column names follow the database snake_case; the domain types in
 * `lib/domain/*` are the camelCase mapping repos return.
 */

export const MEMBER_STATUSES = ["active", "recess"] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const TASK_STATUSES = ["queued", "in-progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ["low", "medium", "high"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const FEEDBACK_CATEGORIES = ["praise", "coaching", "concern"] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const TIME_OFF_TYPES = ["vacation", "license", "sickness", "holiday"] as const
export type TimeOffType = (typeof TIME_OFF_TYPES)[number]

export const TIME_OFF_STATUSES = ["pending", "approved", "rejected"] as const
export type TimeOffStatus = (typeof TIME_OFF_STATUSES)[number]

export const SEMAPHORES = ["green", "yellow", "red"] as const
export type Semaphore = (typeof SEMAPHORES)[number]

export type MemberRow = {
  id: string
  name: string
  role: string
  display_color: string
  status: MemberStatus
  joined_at: string
  notes: string | null
  checkin_freq_days: number
  last_checkin_at: string | null
  next_checkin_at: string
}

export type TaskRow = {
  id: string
  member_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  created_at: string
}

export type ProgressRow = {
  id: string
  task_id: string
  value: number
  progress_date: string
  note: string | null
  created_at: string
  created_sequence: number
}

export type FeedbackRow = {
  id: string
  member_id: string
  rating: number
  content: string
  category: FeedbackCategory
  created_at: string
  created_sequence: number
}

export type SnippetRow = {
  id: string
  title: string
  description: string | null
  content: string
  usage_count: number
  last_used_at: string | null
  last_used_sequence: number | null
  created_at: string
  created_sequence: number
}

export type TimeOffRow = {
  id: string
  member_id: string
  start_date: string
  end_date: string
  type: TimeOffType
  status: TimeOffStatus
  note: string | null
  created_at: string
}

export type CheckInRow = {
  id: string
  member_id: string
  checkin_date: string
  semaphore: Semaphore | null
  note: string | null
  created_at: string
}

export type MigrationRow = {
  version: string
  applied_at: string
}
