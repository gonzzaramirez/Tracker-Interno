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

export const USER_ROLES = ["supervisor", "pm"] as const
export type UserRole = (typeof USER_ROLES)[number]

export type UserRow = {
  id: string
  username: string
  password_hash: string
  role: UserRole
  celula: string | null
  created_at: string
}

export const SHEET_RESULTS = ["done", "hard_match", "soft_match", "not_found", "other"] as const
export type SheetResult = (typeof SHEET_RESULTS)[number]

export const SHEET_GOAL_TYPES = ["daily", "weekly", "monthly"] as const
export type SheetGoalType = (typeof SHEET_GOAL_TYPES)[number]

export type TaskSheetMemberRow = {
  task_id: string
  member_id: string
  sheet_user: string
}

export type TaskDayStatRow = {
  task_id: string
  member_id: string
  date: string
  result: SheetResult
  count: number
  avg_elapsed_seconds: number | null
  min_elapsed_seconds: number | null
  max_elapsed_seconds: number | null
  rows_with_elapsed: number
  total_gap_seconds: number
  max_gap_seconds: number
  gap_count: number
  coverage_start: string | null
  coverage_end: string | null
}

export type TaskSheetRowRow = {
  id: number
  task_id: string
  member_id: string
  date: string
  result: string
  timestamp_start: string | null
  timestamp_end: string | null
  elapsed_seconds: number | null
  sort_order: number
}

export type TaskGoalRow = {
  id: string
  user_id: string
  task_id: string
  name: string
  target: number
  type: SheetGoalType
  status: "active" | "archived"
  member_ids: string
  created_at: string
}

export type MemberRow = {
  id: string
  user_id: string
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
  user_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  sheet_url: string | null
  last_synced_at: string | null
  last_sync_error: string | null
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
  user_id: string
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
  semaphore: "green" | "yellow" | "red" | null
  note: string | null
  created_at: string
}

export type TrackingRecordRow = {
  id: string
  user_id: string
  member_id: string
  rating: number | null
  content_html: string
  record_date: string
  created_at: string
  created_sequence: number
  updated_at: string | null
}

export type TrackingTaskRow = {
  id: string
  user_id: string
  record_id: string
  title: string
  description: string | null
  progress: number
  created_at: string
}

export const EVALUATION_AREA_IDS = [
  "compliance",
  "quality",
  "communication",
  "proactivity",
  "teamwork",
  "attitude",
] as const
export type EvaluationAreaId = (typeof EVALUATION_AREA_IDS)[number]

export type TrackingEvaluationRow = {
  id: string
  user_id: string
  record_id: string
  area_id: EvaluationAreaId
  score: number
  max_score: number
  weight: number
  created_at: string
}

export type BoardRow = {
  id: string
  user_id: string
  name: string
  scene_json: string
  created_at: string
  updated_at: string
}

export type AttendanceRow = {
  id: string
  user_id: string
  member_id: string
  date: string
  /** Wall-clock time (HH:MM) when the mark was made; null for pre-migration rows. */
  marked_at: string | null
  created_at: string
}

export type MigrationRow = {
  version: string
  applied_at: string
}
