/** Task use cases over the SQLite repositories. */

import { cache } from "react"

import type { ProgressRecord, Task, TaskPriority, TaskStatus, TaskWithProgress } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"
import {
  getTaskById,
  insertTask,
  listTasks,
  listTasksByMember,
  updateTaskById,
} from "@/lib/db/repos/tasks"
import { insertProgressRecord, listProgressByTasks } from "@/lib/db/repos/progress"

export type { TaskWithProgress } from "@/lib/domain"

const readTasks = cache(listTasks)
const readTasksByMember = cache(listTasksByMember)
const readTaskById = cache(getTaskById)
const readProgressByTasks = cache(listProgressByTasks)

export type CreateTaskInput = {
  memberId: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
}

export type UpdateTaskInput = {
  title?: string
  description?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string | null
}

function assertTaskFound(task: Task | undefined, id: string): asserts task is Task {
  if (!task) {
    throw new Error(`Task ${id} not found.`)
  }
}

function assertTitle(title: string): void {
  if (!title.trim()) {
    throw new Error("Task title is required.")
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Progress must be a number between 0 and 100.")
  }
  return Math.min(100, Math.max(0, Math.round(value)))
}

function latestValue(records: ProgressRecord[]): number {
  if (records.length === 0) {
    return 0
  }
  const sorted = [...records].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.id.localeCompare(b.id)
  })
  return sorted[sorted.length - 1].value
}

function byDateAsc(a: ProgressRecord, b: ProgressRecord): number {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date)
  }
  return a.id.localeCompare(b.id)
}

async function withRecords(tasks: Task[]): Promise<TaskWithProgress[]> {
  const records = await readProgressByTasks(tasks.map((task) => task.id))
  return tasks.map((task) => {
    const taskRecords = records
      .filter((record) => record.taskId === task.id)
      .sort(byDateAsc)
    return {
      task,
      records: taskRecords,
      currentValue: latestValue(taskRecords),
    }
  })
}

export async function getTasksByMember(memberId: string): Promise<Task[]> {
  return readTasksByMember(memberId)
}

export async function getAllTasks(): Promise<Task[]> {
  return readTasks()
}

export async function getTask(id: string): Promise<Task | undefined> {
  return readTaskById(id)
}

/** All tasks with their progress history — drives /tasks and /members views. */
export async function getTasksWithProgress(): Promise<TaskWithProgress[]> {
  return withRecords(await readTasks())
}

export async function getTasksWithProgressByMember(memberId: string): Promise<TaskWithProgress[]> {
  return withRecords(await readTasksByMember(memberId))
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  assertTitle(input.title)
  return insertTask({
    memberId: input.memberId,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    priority: input.priority,
    dueDate: input.dueDate || undefined,
    status: "queued",
  })
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  if (patch.title !== undefined) {
    assertTitle(patch.title)
  }
  const updated = await updateTaskById(id, {
    ...patch,
    title: patch.title === undefined ? undefined : patch.title.trim(),
  })
  assertTaskFound(updated, id)
  return updated
}

export async function transitionStatus(id: string, status: TaskStatus): Promise<Task> {
  const updated = await updateTaskById(id, { status })
  assertTaskFound(updated, id)
  return updated
}

export async function recordProgress(
  taskId: string,
  value: number,
  note?: string,
): Promise<{ task: Task; record: ProgressRecord }> {
  const task = await readTaskById(taskId)
  assertTaskFound(task, taskId)

  const record = await insertProgressRecord({
    taskId,
    date: todayISO(),
    value: clampProgress(value),
    note: note?.trim() || undefined,
  })

  return { task, record }
}
