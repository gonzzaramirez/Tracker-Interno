"use server"

import { revalidatePath } from "next/cache"

import {
  createTask,
  deleteTask,
  getTask,
  toggleTaskDone,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/services/tasks"
import {
  archiveTaskGoal,
  assertTaskSheetInput,
  createTaskGoal,
  deleteTaskGoal,
  getTaskSheetMembers,
  syncTaskSheet,
  type CreateTaskGoalInput,
  type TaskSyncSummary,
} from "@/lib/services/task-sheets"
import { replaceTaskSheetMembers } from "@/lib/db/repos/task-sheets"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"
import type { Task, TaskGoal, TaskSheetMember } from "@/lib/domain"

function revalidate(taskId?: string): void {
  revalidatePath("/tasks")
  revalidatePath("/goals")
  revalidatePath("/")
  if (taskId) revalidatePath(`/tasks/${taskId}`)
}

export type CreateTaskActionResult = { task: Task; sync: TaskSyncSummary | null }

/** Sheet member mapping submitted with the task form. */
export type TaskSheetMembersInput = Array<{ memberId: string; sheetUser: string }>

export async function createTaskAction(
  input: CreateTaskInput & { sheetMembers?: TaskSheetMembersInput },
): Promise<ActionResult<CreateTaskActionResult>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    assertTaskSheetInput({ sheetUrl: input.sheetUrl, sheetMembers: input.sheetMembers ?? [] })
    const task = await createTask(userId, input)
    let sync: TaskSyncSummary | null = null
    if (task.sheetUrl) {
      await replaceTaskSheetMembers(task.id, input.sheetMembers ?? [])
      sync = await syncTaskSheet(userId, task.id)
    }
    return { task, sync }
  })
  if (result.ok) revalidate(result.data.task.id)
  return result
}

export async function updateTaskAction(
  id: string,
  patch: UpdateTaskInput & { sheetMembers?: TaskSheetMembersInput },
): Promise<ActionResult<CreateTaskActionResult>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    const sheetUrl = patch.sheetUrl === undefined ? undefined : patch.sheetUrl || null
    assertTaskSheetInput({ sheetUrl: sheetUrl ?? undefined, sheetMembers: patch.sheetMembers ?? [] })
    const task = await updateTask(userId, id, { ...patch, sheetUrl })
    let sync: TaskSyncSummary | null = null
    if (task.sheetUrl) {
      await replaceTaskSheetMembers(task.id, patch.sheetMembers ?? [])
      sync = await syncTaskSheet(userId, task.id)
    }
    return { task, sync }
  })
  if (result.ok) revalidate(id)
  return result
}

export async function deleteTaskAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await deleteTask(userId, id); return null })
  if (result.ok) revalidate()
  return result
}

export async function toggleTaskDoneAction(id: string): Promise<ActionResult<Task>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => toggleTaskDone(userId, id))
  if (result.ok) revalidate()
  return result
}

/** Resincronización manual de la planilla de una tarea; devuelve el resumen para la UI. */
export async function syncTaskSheetAction(taskId: string): Promise<ActionResult<TaskSyncSummary>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    const task = await getTask(userId, taskId)
    if (!task) throw new Error("Tarea no encontrada.")
    if (!task.sheetUrl) throw new Error("La tarea no tiene una hoja vinculada.")
    return syncTaskSheet(userId, taskId)
  })
  if (result.ok) revalidate(taskId)
  return result
}

// ---------------------------------------------------------------------------
// Objetivos de hoja (por usuario, sobre tareas con hoja vinculada)
// ---------------------------------------------------------------------------

export async function createTaskGoalAction(input: CreateTaskGoalInput): Promise<ActionResult<TaskGoal>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createTaskGoal(userId, input))
  if (result.ok) revalidate()
  return result
}

/** Miembros mapeados a la planilla de una tarea, para los checkboxes del form de objetivos. */
export async function getTaskSheetMembersAction(
  taskId: string,
): Promise<ActionResult<Array<TaskSheetMember & { memberName: string }>>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  return runActionResult(() => getTaskSheetMembers(userId, taskId))
}

export async function archiveTaskGoalAction(id: string): Promise<ActionResult<TaskGoal>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => archiveTaskGoal(userId, id))
  if (result.ok) revalidate()
  return result
}

export async function deleteTaskGoalAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    await deleteTaskGoal(userId, id)
    return null
  })
  if (result.ok) revalidate()
  return result
}
