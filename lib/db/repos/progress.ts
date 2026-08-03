/**
 * Task progress repository (task 1.5) — raw SQL over the shared connection.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { ProgressRow } from "../schema"
import type { ProgressRecord, Task } from "@/lib/domain"

function toRecord(row: ProgressRow): ProgressRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    date: row.progress_date,
    value: row.value,
    note: row.note ?? undefined,
  }
}

export async function listProgress(): Promise<ProgressRecord[]> {
  const rows = getDb().prepare("SELECT * FROM task_progress").all() as ProgressRow[]
  return rows.map(toRecord)
}

export async function listProgressByTask(taskId: string): Promise<ProgressRecord[]> {
  const rows = getDb()
    .prepare("SELECT * FROM task_progress WHERE task_id = ? ORDER BY progress_date ASC, id ASC")
    .all(taskId) as ProgressRow[]
  return rows.map(toRecord)
}

export async function listProgressByTasks(taskIds: string[]): Promise<ProgressRecord[]> {
  if (taskIds.length === 0) {
    return []
  }
  const placeholders = taskIds.map(() => "?").join(", ")
  const rows = getDb()
    .prepare(`SELECT * FROM task_progress WHERE task_id IN (${placeholders})`)
    .all(...taskIds) as ProgressRow[]
  return rows.map(toRecord)
}

export async function listProgressByMemberTasks(tasks: Task[]): Promise<ProgressRecord[]> {
  return listProgressByTasks(tasks.map((task) => task.id))
}

export async function insertProgressRecord(
  input: Omit<ProgressRecord, "id">
): Promise<ProgressRecord> {
  if (!Number.isInteger(input.value) || input.value < 0 || input.value > 100) {
    throw new RangeError("Progress must be an integer between 0 and 100.")
  }

  const id = randomUUID()
  getDb()
    .prepare(
      `INSERT INTO task_progress (id, task_id, value, progress_date, note)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, input.taskId, input.value, input.date, input.note ?? null)
  const row = getDb().prepare("SELECT * FROM task_progress WHERE id = ?").get(id) as
    | ProgressRow
    | undefined
  if (!row) {
    throw new Error(`Progress record ${id} could not be read after insert.`)
  }
  return toRecord(row)
}
