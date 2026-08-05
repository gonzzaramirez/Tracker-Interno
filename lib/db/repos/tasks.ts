/**
 * Tasks repository — informational tasks per tenant.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { TaskRow } from "../schema"
import type { Task } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

export type NewTask = { title: string; description?: string }
export type UpdateTask = { title?: string; description?: string | null }

function toTask(row: TaskRow): Task {
  return { id: row.id, title: row.title, description: row.description ?? undefined, createdAt: row.created_at }
}

export async function listTasks(userId: string): Promise<Task[]> {
  const rows = getDb().prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC, id ASC").all(userId) as TaskRow[]
  return rows.map(toTask)
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  const row = getDb().prepare("SELECT * FROM tasks WHERE user_id = ? AND id = ?").get(userId, id) as TaskRow | undefined
  return row ? toTask(row) : undefined
}

export async function insertTask(userId: string, input: NewTask): Promise<Task> {
  const id = randomUUID()
  const createdAt = todayISO()
  getDb().prepare("INSERT INTO tasks (id, user_id, title, description, created_at) VALUES (?, ?, ?, ?, ?)").run(id, userId, input.title, input.description ?? null, createdAt)
  const task = await getTaskById(userId, id)
  if (!task) throw new Error(`Task ${id} could not be read after insert.`)
  return task
}

export async function updateTaskById(userId: string, id: string, patch: UpdateTask): Promise<Task | undefined> {
  const entries: Array<{ column: string; value: string | null }> = []
  if (patch.title !== undefined) entries.push({ column: "title", value: patch.title })
  if (patch.description !== undefined) entries.push({ column: "description", value: patch.description })
  if (entries.length === 0) return getTaskById(userId, id)
  const setClause = entries.map(({ column }) => `${column} = ?`).join(", ")
  getDb().prepare(`UPDATE tasks SET ${setClause} WHERE user_id = ? AND id = ?`).run(...entries.map(({ value }) => value), userId, id)
  return getTaskById(userId, id)
}

export async function deleteTaskById(userId: string, id: string): Promise<boolean> {
  const result = getDb().prepare("DELETE FROM tasks WHERE user_id = ? AND id = ?").run(userId, id)
  return Number(result.changes) > 0
}
