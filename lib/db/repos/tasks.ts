/**
 * Tasks repository (task 1.5) — raw SQL over the shared connection.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { TaskRow } from "../schema"
import type { Task, TaskPriority, TaskStatus } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

export type NewTask = Omit<Task, "id" | "createdAt">
export type UpdateTask = {
  title?: string
  description?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string | null
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listTasks(): Promise<Task[]> {
  const rows = getDb().prepare("SELECT * FROM tasks ORDER BY created_at ASC").all() as TaskRow[]
  return rows.map(toTask)
}

export async function listTasksByMember(memberId: string): Promise<Task[]> {
  const rows = getDb()
    .prepare("SELECT * FROM tasks WHERE member_id = ? ORDER BY created_at ASC")
    .all(memberId) as TaskRow[]
  return rows.map(toTask)
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined
  return row ? toTask(row) : undefined
}

export async function insertTask(input: NewTask): Promise<Task> {
  const id = randomUUID()
  const createdAt = todayISO()
  getDb()
    .prepare(
      `INSERT INTO tasks (id, member_id, title, description, priority, status, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.memberId,
      input.title,
      input.description ?? null,
      input.priority,
      input.status,
      input.dueDate ?? null,
       createdAt
    )
  const task = await getTaskById(id)
  if (!task) {
    throw new Error(`Task ${id} could not be read after insert.`)
  }
  return task
}

export async function updateTaskById(
  id: string,
  patch: UpdateTask
): Promise<Task | undefined> {
  const entries: Array<{ column: string; value: string | null }> = []
  if (patch.title !== undefined) entries.push({ column: "title", value: patch.title })
  if (patch.description !== undefined) {
    entries.push({ column: "description", value: patch.description })
  }
  if (patch.priority !== undefined) entries.push({ column: "priority", value: patch.priority })
  if (patch.status !== undefined) entries.push({ column: "status", value: patch.status })
  if (patch.dueDate !== undefined) entries.push({ column: "due_date", value: patch.dueDate })

  if (entries.length === 0) {
    return getTaskById(id)
  }

  const setClause = entries.map(({ column }) => `${column} = ?`).join(", ")
  getDb()
    .prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`)
    .run(...entries.map(({ value }) => value), id)

  return getTaskById(id)
}
