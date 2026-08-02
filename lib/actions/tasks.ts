"use server"

/**
 * Task Server Actions (task 4.2) — mutate the in-memory store and refresh the
 * tasks view (REQ-CC-002). Returns `ActionResult` envelopes.
 */

import { revalidatePath } from "next/cache"

import {
  createTask,
  recordProgress,
  transitionStatus,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/services/tasks"
import type { TaskStatus } from "@/lib/domain"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import type { ProgressRecord, Task } from "@/lib/domain"

export async function createTaskAction(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => createTask(input))
  if (result.ok) {
    revalidatePath("/tasks")
  }
  return result
}

export async function updateTaskAction(
  taskId: string,
  patch: UpdateTaskInput
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => updateTask(taskId, patch))
  if (result.ok) {
    revalidatePath("/tasks")
  }
  return result
}

export async function transitionTaskAction(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => transitionStatus(taskId, status))
  if (result.ok) {
    revalidatePath("/tasks")
  }
  return result
}

export async function recordProgressAction(
  taskId: string,
  value: number,
  note?: string
): Promise<ActionResult<{ task: Task; record: ProgressRecord }>> {
  const result = await runActionResult(() => recordProgress(taskId, value, note))
  if (result.ok) {
    revalidatePath("/tasks")
  }
  return result
}