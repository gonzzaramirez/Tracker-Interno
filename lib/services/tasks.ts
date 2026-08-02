/**
 * Task use cases (task 4.1). Mutations return the affected entity so Server
 * Actions can echo them back; errors throw and are caught by the action
 * wrapper (lib/actions/result.ts).
 */

import type { ProgressRecord, Task, TaskPriority, TaskStatus } from "@/lib/domain"
import {
  getTaskById,
  insertTask,
  listTasks,
  listTasksByMember,
  updateTaskById,
} from "@/lib/data/tasks"
import { insertProgressRecord, listProgressByTasks } from "@/lib/data/progress"
import { todayISO } from "@/lib/data/date"

export type CreateTaskInput = {
  memberId: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
}

export type UpdateTaskInput = Partial<Omit<Task, "id" | "memberId" | "createdAt">>

/** Task plus its progress history and the latest value (0 when empty). */
export type TaskWithProgress = {
  task: Task
  records: ProgressRecord[]
  /** Latest record value, 0 if the task has no history (REQ-TT-003). */
  currentValue: number
}

function assertTaskFound(task: Task | undefined, id: string): asserts task is Task {
  if (!task) {
    throw new Error(`Task ${id} not found.`)
  }
}

function assertTitle(title: string) {
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
  const records = await listProgressByTasks(tasks.map((task) => task.id))
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
  return listTasksByMember(memberId)
}

export async function getAllTasks(): Promise<Task[]> {
  return listTasks()
}

export async function getTask(id: string): Promise<Task | undefined> {
  return getTaskById(id)
}

/** All tasks with their progress history — drives /tasks and /members views. */
export async function getTasksWithProgress(): Promise<TaskWithProgress[]> {
  return withRecords(await listTasks())
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

/** Status transitions (REQ-TT-004). */
export async function transitionStatus(id: string, status: TaskStatus): Promise<Task> {
  const updated = await updateTaskById(id, { status })
  assertTaskFound(updated, id)
  return updated
}

/** Records a 0-100 progress value for a task (REQ-TT-003). */
export async function recordProgress(
  taskId: string,
  value: number,
  note?: string
): Promise<{ task: Task; record: ProgressRecord }> {
  const task = await getTaskById(taskId)
  assertTaskFound(task, taskId)

  const record = await insertProgressRecord({
    taskId,
    date: todayISO(),
    value: clampProgress(value),
    note: note?.trim() || undefined,
  })

  return { task, record }
}