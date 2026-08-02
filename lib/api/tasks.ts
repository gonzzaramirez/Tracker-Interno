/**
 * FUTURE HTTP contract for the task-tracking capability (task 1.5).
 *
 * DEFINED but NEVER invoked — documents the swap shape only (REQ-CC-001).
 */

import type { ProgressRecord, Task, TaskPriority, TaskStatus } from "@/lib/domain"

export type CreateTaskInput = {
  memberId: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
}

export interface TasksApi {
  getTasksByMember: (memberId: string) => Promise<Task[]>
  getTask: (id: string) => Promise<Task | undefined>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "memberId" | "createdAt">>) => Promise<Task>
  transitionStatus: (id: string, status: TaskStatus) => Promise<Task>
  recordProgress: (id: string, value: number, note?: string) => Promise<{ task: Task; record: ProgressRecord }>
}

export const tasksApi: TasksApi = {
  async getTasksByMember() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getTask() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async createTask() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async updateTask() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async transitionStatus() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async recordProgress() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}