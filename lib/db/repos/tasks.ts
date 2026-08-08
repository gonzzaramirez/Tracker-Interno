/**
 * Tasks repository — informational tasks per tenant.
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
import type { TaskRow } from "../schema"
import type { Task } from "@/lib/domain"

export type NewTask = { title: string; description?: string; sheetUrl?: string | null }
export type UpdateTask = { title?: string; description?: string | null; sheetUrl?: string | null }

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    sheetUrl: row.sheet_url,
    lastSyncedAt: row.last_synced_at,
    lastSyncError: row.last_sync_error,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listTasks(userId: string): Promise<Task[]> {
  const rows = await query<TaskRow>("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC, id ASC", [userId])
  return rows.map(toTask)
}

/** Cross-tenant: every task with a linked sheet (cron sync path). */
export async function listAllTasksWithSheetUrl(): Promise<Task[]> {
  const rows = await query<TaskRow>("SELECT * FROM tasks WHERE sheet_url IS NOT NULL ORDER BY created_at ASC, id ASC")
  return rows.map(toTask)
}

export async function listCompletedTasksInRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
  const rows = await query<TaskRow>(
    "SELECT * FROM tasks WHERE user_id = ? AND status = 'done' AND completed_at IS NOT NULL AND completed_at BETWEEN ? AND ? ORDER BY completed_at ASC, id ASC",
    [userId, startDate, endDate],
  )
  return rows.map(toTask)
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  const row = await queryOne<TaskRow>("SELECT * FROM tasks WHERE user_id = ? AND id = ?", [userId, id])
  return row ? toTask(row) : undefined
}

export async function insertTask(userId: string, input: NewTask): Promise<Task> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  await mutate("INSERT INTO tasks (id, user_id, title, description, sheet_url, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    id,
    userId,
    input.title,
    input.description ?? null,
    input.sheetUrl ?? null,
    createdAt,
  ])
  const task = await getTaskById(userId, id)
  if (!task) throw new Error(`Task ${id} could not be read after insert.`)
  return task
}

export async function updateTaskById(userId: string, id: string, patch: UpdateTask): Promise<Task | undefined> {
  const entries: Array<{ column: string; value: string | null }> = []
  if (patch.title !== undefined) entries.push({ column: "title", value: patch.title })
  if (patch.description !== undefined) entries.push({ column: "description", value: patch.description })
  if (patch.sheetUrl !== undefined) {
    entries.push({ column: "sheet_url", value: patch.sheetUrl })
    // A changed/removed sheet URL invalidates the stored sync error.
    entries.push({ column: "last_sync_error", value: null })
  }
  if (entries.length === 0) return getTaskById(userId, id)
  const setClause = entries.map(({ column }) => `${column} = ?`).join(", ")
  await mutate(`UPDATE tasks SET ${setClause} WHERE user_id = ? AND id = ?`, [...entries.map((e) => e.value), userId, id])
  return getTaskById(userId, id)
}

export async function deleteTaskById(userId: string, id: string): Promise<boolean> {
  const changes = await mutate("DELETE FROM tasks WHERE user_id = ? AND id = ?", [userId, id])
  if (changes > 0) {
    await mutate("DELETE FROM task_sheet_members WHERE task_id = ?", [id])
    await mutate("DELETE FROM task_sheet_rows WHERE task_id = ?", [id])
    await mutate("DELETE FROM task_daily_stats WHERE task_id = ?", [id])
    await mutate("DELETE FROM task_goals WHERE user_id = ? AND task_id = ?", [userId, id])
  }
  return changes > 0
}

/** Mark a task as done, stamping the completion date (YYYY-MM-DD). */
export async function markTaskCompleted(userId: string, id: string, completedAt: string): Promise<Task | undefined> {
  await mutate("UPDATE tasks SET status = 'done', completed_at = ? WHERE user_id = ? AND id = ?", [completedAt, userId, id])
  return getTaskById(userId, id)
}

/** Reopen a completed task, clearing the completion date. */
export async function markTaskUncompleted(userId: string, id: string): Promise<Task | undefined> {
  await mutate("UPDATE tasks SET status = 'queued', completed_at = NULL WHERE user_id = ? AND id = ?", [userId, id])
  return getTaskById(userId, id)
}

/** Stamp the last sheet sync timestamp and clear any stored sync error. */
export async function setTaskLastSyncedAt(userId: string, id: string, at: string): Promise<void> {
  await mutate("UPDATE tasks SET last_synced_at = ?, last_sync_error = NULL WHERE user_id = ? AND id = ?", [at, userId, id])
}

/** Persist the last sheet sync failure; pass null to clear it. */
export async function setTaskSyncError(userId: string, id: string, error: string | null): Promise<void> {
  await mutate("UPDATE tasks SET last_sync_error = ? WHERE user_id = ? AND id = ?", [error, userId, id])
}
