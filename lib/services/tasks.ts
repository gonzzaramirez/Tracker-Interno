/** Informational task use cases per tenant. */
import { cache } from "react"

import type { Task } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"
import { deleteTaskById, getTaskById, insertTask, listTasks, markTaskCompleted, markTaskUncompleted, updateTaskById } from "@/lib/db/repos/tasks"
import { normalizeSheetUrl } from "@/lib/services/task-sheets"

const memoList = cache((userId: string) => listTasks(userId))
const memoById = cache((userId: string, id: string) => getTaskById(userId, id))

export type CreateTaskInput = { title: string; description?: string; sheetUrl?: string | null }
export type UpdateTaskInput = { title?: string; description?: string | null; sheetUrl?: string | null }

export async function getAllTasks(userId: string): Promise<Task[]> { return memoList(userId) }
export async function getTask(userId: string, id: string): Promise<Task | undefined> { return memoById(userId, id) }

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  if (!input.title.trim()) throw new Error("El título de la tarea es obligatorio.")
  const sheetUrl = normalizeSheetUrl(input.sheetUrl)
  if (input.sheetUrl && !sheetUrl) throw new Error("La URL no es una planilla de Google Sheets válida.")
  return insertTask(userId, {
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    sheetUrl,
  })
}

export async function updateTask(userId: string, id: string, patch: UpdateTaskInput): Promise<Task> {
  const sheetUrl = patch.sheetUrl === undefined ? undefined : normalizeSheetUrl(patch.sheetUrl)
  if (patch.sheetUrl !== undefined && !sheetUrl) throw new Error("La URL no es una planilla de Google Sheets válida.")
  const updated = await updateTaskById(userId, id, { ...patch, title: patch.title?.trim(), sheetUrl })
  if (!updated) throw new Error(`Tarea ${id} no encontrada.`)
  return updated
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  if (!(await deleteTaskById(userId, id))) throw new Error(`Tarea ${id} no encontrada.`)
}

/** Mark a task as done, stamping today (Argentina) as the completion date. */
export async function completeTask(userId: string, id: string): Promise<Task> {
  const updated = await markTaskCompleted(userId, id, todayISO())
  if (!updated) throw new Error(`Tarea ${id} no encontrada.`)
  return updated
}

/** Reopen a completed task. */
export async function reopenTask(userId: string, id: string): Promise<Task> {
  const updated = await markTaskUncompleted(userId, id)
  if (!updated) throw new Error(`Tarea ${id} no encontrada.`)
  return updated
}

/** Complete if pending, reopen if already done. */
export async function toggleTaskDone(userId: string, id: string): Promise<Task> {
  const task = await getTask(userId, id)
  if (!task) throw new Error(`Tarea ${id} no encontrada.`)
  return task.completedAt ? reopenTask(userId, id) : completeTask(userId, id)
}
