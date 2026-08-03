"use server"

/**
 * Task Server Actions (task 4.2) — persist mutations through the SQLite-backed
 * services and refresh affected views (REQ-CC-002).
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

function revalidateTaskPaths(memberId: string): void {
  revalidatePath("/tasks")
  revalidatePath("/")
  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
}

export async function createTaskAction(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => createTask(input))
  if (result.ok) {
    revalidateTaskPaths(result.data.memberId)
  }
  return result
}

export async function updateTaskAction(
  taskId: string,
  patch: UpdateTaskInput
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => updateTask(taskId, patch))
  if (result.ok) {
    revalidateTaskPaths(result.data.memberId)
  }
  return result
}

export async function transitionTaskAction(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<Task>> {
  const result = await runActionResult(() => transitionStatus(taskId, status))
  if (result.ok) {
    revalidateTaskPaths(result.data.memberId)
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
    revalidateTaskPaths(result.data.task.memberId)
  }
  return result
}
