/**
 * Mock progress repo — progress records linked to tasks.
 */

import type { ProgressRecord, Task } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listProgress(): Promise<ProgressRecord[]> {
  await delay()
  return [...getDb().progress]
}

export async function listProgressByTask(taskId: string): Promise<ProgressRecord[]> {
  await delay()
  return getDb().progress.filter((record) => record.taskId === taskId)
}

export async function listProgressByTasks(taskIds: string[]): Promise<ProgressRecord[]> {
  await delay()
  const wanted = new Set(taskIds)
  return getDb().progress.filter((record) => wanted.has(record.taskId))
}

export async function insertProgressRecord(
  input: Omit<ProgressRecord, "id">
): Promise<ProgressRecord> {
  await delay()
  const db = getDb()
  const record: ProgressRecord = {
    ...input,
    id: `pr-${db.counters.progress}`,
  }
  db.counters.progress += 1
  db.progress.push(record)
  return record
}

/** Progress records for every task owned by a member (join helper used by services). */
export async function listProgressByMemberTasks(tasks: Task[]): Promise<ProgressRecord[]> {
  return listProgressByTasks(tasks.map((task) => task.id))
}