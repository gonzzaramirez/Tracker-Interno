/**
 * Mock feedback repo — async read/write access to the in-memory store.
 */

import type { Feedback } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"
import { todayISO } from "./date"

export async function listFeedback(): Promise<Feedback[]> {
  await delay()
  return [...getDb().feedback]
}

export async function listFeedbackByMember(memberId: string): Promise<Feedback[]> {
  await delay()
  return getDb().feedback.filter((feedback) => feedback.memberId === memberId)
}

export async function insertFeedback(
  input: Omit<Feedback, "id" | "date">
): Promise<Feedback> {
  await delay()
  const db = getDb()
  const feedback: Feedback = {
    ...input,
    id: `fb-${db.counters.feedback}`,
    date: todayISO(),
  }
  db.counters.feedback += 1
  db.feedback.push(feedback)
  return feedback
}