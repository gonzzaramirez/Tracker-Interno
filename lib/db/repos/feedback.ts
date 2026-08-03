/**
 * Feedback repository (task 1.5) — raw SQL over the shared connection.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { FeedbackRow } from "../schema"
import type { Feedback, FeedbackCategory } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    memberId: row.member_id,
    date: row.created_at,
    rating: row.rating,
    content: row.content,
    category: row.category as FeedbackCategory,
  }
}

export type NewFeedback = Omit<Feedback, "id" | "date">

export async function listFeedback(): Promise<Feedback[]> {
  const rows = getDb()
    .prepare("SELECT * FROM feedback ORDER BY created_at DESC")
    .all() as FeedbackRow[]
  return rows.map(toFeedback)
}

export async function listFeedbackByMember(memberId: string): Promise<Feedback[]> {
  const rows = getDb()
    .prepare("SELECT * FROM feedback WHERE member_id = ? ORDER BY created_at DESC")
    .all(memberId) as FeedbackRow[]
  return rows.map(toFeedback)
}

export async function insertFeedback(input: NewFeedback): Promise<Feedback> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new RangeError("Rating must be an integer between 1 and 5.")
  }

  const id = randomUUID()
  const createdAt = todayISO()
  getDb()
    .prepare(
      `INSERT INTO feedback (id, member_id, rating, content, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.memberId, input.rating, input.content, input.category, createdAt)
  const row = getDb().prepare("SELECT * FROM feedback WHERE id = ?").get(id) as
    | FeedbackRow
    | undefined
  if (!row) {
    throw new Error(`Feedback ${id} could not be read after insert.`)
  }
  return toFeedback(row)
}
