/**
 * Mock feedback repo — async read/write access to the in-memory store.
 */

import type { Feedback } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listFeedback(): Promise<Feedback[]> {
  await delay()
  return [...getDb().feedback]
}

export async function listFeedbackByMember(memberId: string): Promise<Feedback[]> {
  await delay()
  return getDb().feedback.filter((feedback) => feedback.memberId === memberId)
}

export async function insertFeedback(feedback: Feedback): Promise<Feedback> {
  await delay()
  getDb().feedback.push(feedback)
  return feedback
}