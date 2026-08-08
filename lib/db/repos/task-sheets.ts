/**
 * Task-sheet repository — la importación de Google Sheets vinculada a
 * tareas: mapeo miembro ↔ usuario en la planilla, conteos diarios y
 * objetivos de hoja. Todo scoped por tenant (user_id en tasks/goals).
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
import type { SheetResult, TaskDayStatRow, TaskGoalRow, TaskSheetMemberRow, TaskSheetRowRow } from "../schema"
import type { TaskDayStat, TaskGoal, TaskSheetMember, TaskSheetRow } from "@/lib/domain"

function toMember(row: TaskSheetMemberRow): TaskSheetMember {
  return { taskId: row.task_id, memberId: row.member_id, sheetUser: row.sheet_user }
}

function toStat(row: TaskDayStatRow): TaskDayStat {
  const stat: TaskDayStat = {
    taskId: row.task_id,
    memberId: row.member_id,
    date: row.date,
    result: row.result,
    count: row.count,
  }
  if (row.rows_with_elapsed > 0) {
    stat.avgElapsedSeconds = row.avg_elapsed_seconds ?? undefined
    stat.minElapsedSeconds = row.min_elapsed_seconds ?? undefined
    stat.maxElapsedSeconds = row.max_elapsed_seconds ?? undefined
    stat.rowsWithElapsed = row.rows_with_elapsed
  }
  if (row.gap_count > 0) {
    stat.totalGapSeconds = row.total_gap_seconds
    stat.maxGapSeconds = row.max_gap_seconds
    stat.gapCount = row.gap_count
    stat.coverageStart = row.coverage_start ?? undefined
    stat.coverageEnd = row.coverage_end ?? undefined
  }
  return stat
}

function toGoal(row: TaskGoalRow): TaskGoal {
  let memberIds: string[] = []
  try {
    const parsed = JSON.parse(row.member_ids)
    if (Array.isArray(parsed)) memberIds = parsed
  } catch {
    // Pre-migration rows have no member_ids column; default to empty (all members).
  }
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    name: row.name,
    target: row.target,
    type: row.type,
    status: row.status,
    memberIds,
    createdAt: row.created_at,
  }
}

function toSheetRow(row: TaskSheetRowRow): TaskSheetRow {
  return {
    id: row.id,
    taskId: row.task_id,
    memberId: row.member_id,
    date: row.date,
    result: row.result as TaskSheetRow["result"],
    timestampStart: row.timestamp_start,
    timestampEnd: row.timestamp_end,
    elapsedSeconds: row.elapsed_seconds,
    sortOrder: row.sort_order,
  }
}

// ---------------------------------------------------------------------------
// Task members (miembro ↔ usuario en la planilla)
// ---------------------------------------------------------------------------

export async function listTaskSheetMembers(taskId: string): Promise<TaskSheetMember[]> {
  const rows = await query<TaskSheetMemberRow>(
    "SELECT * FROM task_sheet_members WHERE task_id = ? ORDER BY sheet_user ASC",
    [taskId],
  )
  return rows.map(toMember)
}

/** Replaces the whole member mapping of a task (delete + insert). */
export async function replaceTaskSheetMembers(
  taskId: string,
  members: Array<{ memberId: string; sheetUser: string }>,
): Promise<void> {
  await mutate("DELETE FROM task_sheet_members WHERE task_id = ?", [taskId])
  for (const member of members) {
    if (!member.memberId || !member.sheetUser.trim()) continue
    await mutate(
      "INSERT INTO task_sheet_members (task_id, member_id, sheet_user) VALUES (?, ?, ?)",
      [taskId, member.memberId, member.sheetUser.trim()],
    )
  }
}

// ---------------------------------------------------------------------------
// Individual sheet rows (preserves CSV order for gap calculation)
// ---------------------------------------------------------------------------

/** Replaces all sheet rows for a task (delete all + batch insert new ones). */
export async function insertSheetRows(
  taskId: string,
  rows: Array<{
    memberId: string
    date: string
    result: SheetResult
    timestampStart: string | null
    timestampEnd: string | null
    elapsedSeconds: number | null
    sortOrder: number
  }>,
): Promise<void> {
  await mutate("DELETE FROM task_sheet_rows WHERE task_id = ?", [taskId])
  if (rows.length === 0) return

  // Batch insert in chunks of 500 to avoid oversized SQL statements.
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ")
    const params: Array<string | number | null> = []
    for (const row of chunk) {
      params.push(
        taskId,
        row.memberId,
        row.date,
        row.result,
        row.timestampStart,
        row.timestampEnd,
        row.elapsedSeconds,
        row.sortOrder,
      )
    }
    await mutate(
      `INSERT INTO task_sheet_rows (task_id, member_id, date, result, timestamp_start, timestamp_end, elapsed_seconds, sort_order) VALUES ${placeholders}`,
      params,
    )
  }
}

/** Lists individual sheet rows for a member on a specific date (sorted by sort_order). */
export async function listSheetRows(taskId: string, memberId: string, date: string): Promise<TaskSheetRow[]> {
  const rows = await query<TaskSheetRowRow>(
    "SELECT * FROM task_sheet_rows WHERE task_id = ? AND member_id = ? AND date = ? ORDER BY sort_order ASC",
    [taskId, memberId, date],
  )
  return rows.map(toSheetRow)
}

/** Lists all sheet rows for a task (used to build the view Map). */
export async function listAllSheetRows(taskId: string): Promise<TaskSheetRow[]> {
  const rows = await query<TaskSheetRowRow>(
    "SELECT * FROM task_sheet_rows WHERE task_id = ? ORDER BY member_id ASC, date ASC, sort_order ASC",
    [taskId],
  )
  return rows.map(toSheetRow)
}

// ---------------------------------------------------------------------------
// Daily stats
// ---------------------------------------------------------------------------

/** Absolute upsert: the sync recomputes full-day counts each run. */
export async function upsertDayStat(
  taskId: string,
  memberId: string,
  date: string,
  result: SheetResult,
  count: number,
  timeStats?: {
    avgElapsedSeconds: number | null
    minElapsedSeconds: number | null
    maxElapsedSeconds: number | null
    rowsWithElapsed: number
  },
  gapStats?: {
    totalGapSeconds: number
    maxGapSeconds: number
    gapCount: number
    coverageStart: string | null
    coverageEnd: string | null
  },
): Promise<void> {
  await mutate(
    `INSERT INTO task_daily_stats (task_id, member_id, date, result, count, avg_elapsed_seconds, min_elapsed_seconds, max_elapsed_seconds, rows_with_elapsed, total_gap_seconds, max_gap_seconds, gap_count, coverage_start, coverage_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (task_id, member_id, date, result) DO UPDATE SET
       count = excluded.count,
       avg_elapsed_seconds = excluded.avg_elapsed_seconds,
       min_elapsed_seconds = excluded.min_elapsed_seconds,
       max_elapsed_seconds = excluded.max_elapsed_seconds,
       rows_with_elapsed = excluded.rows_with_elapsed,
       total_gap_seconds = excluded.total_gap_seconds,
       max_gap_seconds = excluded.max_gap_seconds,
       gap_count = excluded.gap_count,
       coverage_start = excluded.coverage_start,
       coverage_end = excluded.coverage_end`,
    [
      taskId,
      memberId,
      date,
      result,
      count,
      timeStats?.avgElapsedSeconds ?? null,
      timeStats?.minElapsedSeconds ?? null,
      timeStats?.maxElapsedSeconds ?? null,
      timeStats?.rowsWithElapsed ?? 0,
      gapStats?.totalGapSeconds ?? 0,
      gapStats?.maxGapSeconds ?? 0,
      gapStats?.gapCount ?? 0,
      gapStats?.coverageStart ?? null,
      gapStats?.coverageEnd ?? null,
    ],
  )
}

export async function listStatsInRange(taskId: string, memberIds: string[], startDate: string, endDate: string): Promise<TaskDayStat[]> {
  if (memberIds.length === 0) return []
  const placeholders = memberIds.map(() => "?").join(",")
  const rows = await query<TaskDayStatRow>(
    `SELECT * FROM task_daily_stats
     WHERE task_id = ? AND member_id IN (${placeholders}) AND date BETWEEN ? AND ?
     ORDER BY date ASC, member_id ASC, result ASC`,
    [taskId, ...memberIds, startDate, endDate],
  )
  return rows.map(toStat)
}

export async function listStatsAllTime(taskId: string, memberIds: string[]): Promise<TaskDayStat[]> {
  if (memberIds.length === 0) return []
  const placeholders = memberIds.map(() => "?").join(",")
  const rows = await query<TaskDayStatRow>(
    `SELECT * FROM task_daily_stats
     WHERE task_id = ? AND member_id IN (${placeholders})
     ORDER BY date ASC, member_id ASC, result ASC`,
    [taskId, ...memberIds],
  )
  return rows.map(toStat)
}

// ---------------------------------------------------------------------------
// Task goals (objetivos de hoja, por usuario)
// ---------------------------------------------------------------------------

export async function insertTaskGoal(
  userId: string,
  input: { taskId: string; name: string; target: number; type: TaskGoal["type"]; memberIds?: string[] },
): Promise<TaskGoal> {
  const id = randomUUID()
  const memberIds = input.memberIds && input.memberIds.length > 0 ? JSON.stringify(input.memberIds) : "[]"
  await mutate(
    "INSERT INTO task_goals (id, user_id, task_id, name, target, type, status, member_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)",
    [id, userId, input.taskId, input.name, input.target, input.type, memberIds, new Date().toISOString()],
  )
  const goal = await getTaskGoal(userId, id)
  if (!goal) throw new Error(`Task goal ${id} could not be read after insert.`)
  return goal
}

export async function listTaskGoals(userId: string): Promise<TaskGoal[]> {
  const rows = await query<TaskGoalRow>(
    "SELECT * FROM task_goals WHERE user_id = ? ORDER BY created_at DESC, id ASC",
    [userId],
  )
  return rows.map(toGoal)
}

export async function getTaskGoal(userId: string, id: string): Promise<TaskGoal | undefined> {
  const row = await queryOne<TaskGoalRow>("SELECT * FROM task_goals WHERE user_id = ? AND id = ?", [userId, id])
  return row ? toGoal(row) : undefined
}

export async function setTaskGoalStatus(userId: string, id: string, status: TaskGoal["status"]): Promise<TaskGoal | undefined> {
  await mutate("UPDATE task_goals SET status = ? WHERE user_id = ? AND id = ?", [status, userId, id])
  return getTaskGoal(userId, id)
}

export async function deleteTaskGoal(userId: string, id: string): Promise<boolean> {
  const changes = await mutate("DELETE FROM task_goals WHERE user_id = ? AND id = ?", [userId, id])
  return changes > 0
}

/** Updates the member subset for an existing task goal. */
export async function updateTaskGoalMembers(
  userId: string,
  id: string,
  memberIds: string[],
): Promise<TaskGoal | undefined> {
  const json = memberIds.length > 0 ? JSON.stringify(memberIds) : "[]"
  await mutate("UPDATE task_goals SET member_ids = ? WHERE user_id = ? AND id = ?", [json, userId, id])
  return getTaskGoal(userId, id)
}

// ---------------------------------------------------------------------------
// Date anchoring for goal periods
// ---------------------------------------------------------------------------

/** Returns the most recent date with stats for the given task and members. */
export async function getLatestStatDate(taskId: string, memberIds: string[]): Promise<string | null> {
  if (memberIds.length === 0) return null
  const placeholders = memberIds.map(() => "?").join(",")
  const row = await queryOne<{ max_date: string }>(
    `SELECT MAX(date) as max_date FROM task_daily_stats
     WHERE task_id = ? AND member_id IN (${placeholders})`,
    [taskId, ...memberIds],
  )
  return row?.max_date ?? null
}

// ---------------------------------------------------------------------------
// Elapsed-time summary (for task-item badge)
// ---------------------------------------------------------------------------

/** Global average elapsed time for all "done" rows of a task (or null if no data). */
export async function getTaskElapsedSummary(taskId: string, memberIds: string[]): Promise<{ avgElapsedSeconds: number | null }> {
  if (memberIds.length === 0) return { avgElapsedSeconds: null }
  const placeholders = memberIds.map(() => "?").join(",")
  const row = await queryOne<{ avg_elapsed: number | null }>(
    `SELECT AVG(avg_elapsed_seconds) as avg_elapsed FROM task_daily_stats
     WHERE task_id = ? AND member_id IN (${placeholders})
       AND result = 'done' AND avg_elapsed_seconds IS NOT NULL`,
    [taskId, ...memberIds],
  )
  return { avgElapsedSeconds: row?.avg_elapsed ? Math.round(row.avg_elapsed) : null }
}
