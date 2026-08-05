"use server"

import { revalidatePath } from "next/cache"

import { createTask, deleteTask, updateTask, type CreateTaskInput, type UpdateTaskInput } from "@/lib/services/tasks"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"
import type { Task } from "@/lib/domain"

function revalidate(): void { revalidatePath("/tasks"); revalidatePath("/") }

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<Task>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createTask(userId, input))
  if (result.ok) revalidate()
  return result
}

export async function updateTaskAction(id: string, patch: UpdateTaskInput): Promise<ActionResult<Task>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => updateTask(userId, id, patch))
  if (result.ok) revalidate()
  return result
}

export async function deleteTaskAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await deleteTask(userId, id); return null })
  if (result.ok) revalidate()
  return result
}
