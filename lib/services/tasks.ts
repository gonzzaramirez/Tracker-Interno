/** Informational task use cases per tenant. */
import { cache } from "react"

import type { Task } from "@/lib/domain"
import { deleteTaskById, getTaskById, insertTask, listTasks, updateTaskById } from "@/lib/db/repos/tasks"

const memoList = cache((userId: string) => listTasks(userId))
const memoById = cache((userId: string, id: string) => getTaskById(userId, id))

export type CreateTaskInput = { title: string; description?: string }
export type UpdateTaskInput = { title?: string; description?: string | null }

export async function getAllTasks(userId: string): Promise<Task[]> { return memoList(userId) }
export async function getTask(userId: string, id: string): Promise<Task | undefined> { return memoById(userId, id) }

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  if (!input.title.trim()) throw new Error("El título de la tarea es obligatorio.")
  return insertTask(userId, { title: input.title.trim(), description: input.description?.trim() || undefined })
}

export async function updateTask(userId: string, id: string, patch: UpdateTaskInput): Promise<Task> {
  const updated = await updateTaskById(userId, id, { ...patch, title: patch.title?.trim() })
  if (!updated) throw new Error(`Tarea ${id} no encontrada.`)
  return updated
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  if (!(await deleteTaskById(userId, id))) throw new Error(`Tarea ${id} no encontrada.`)
}
