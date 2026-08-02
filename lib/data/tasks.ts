/**
 * Mock tasks repo — async read/write access to the in-memory store.
 */

import type { Task } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listTasks(): Promise<Task[]> {
  await delay()
  return [...getDb().tasks]
}

export async function listTasksByMember(memberId: string): Promise<Task[]> {
  await delay()
  return getDb().tasks.filter((task) => task.memberId === memberId)
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await delay()
  return getDb().tasks.find((task) => task.id === id)
}

export async function insertTask(task: Task): Promise<Task> {
  await delay()
  getDb().tasks.push(task)
  return task
}

export async function updateTaskById(
  id: string,
  patch: Partial<Omit<Task, "id" | "memberId" | "createdAt">>
): Promise<Task | undefined> {
  await delay()
  const db = getDb()
  const index = db.tasks.findIndex((task) => task.id === id)
  if (index === -1) {
    return undefined
  }
  db.tasks[index] = { ...db.tasks[index], ...patch }
  return db.tasks[index]
}