/**
 * Feedback use cases (task 5.1).
 */

import type { Feedback, FeedbackCategory } from "@/lib/domain"
import { insertFeedback, listFeedbackByMember } from "@/lib/data/feedback"

export type CreateFeedbackInput = {
  memberId: string
  rating: number
  content: string
  category: FeedbackCategory
}

function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) {
    throw new Error("Rating must be a number between 0 and 5.")
  }
  return Math.min(5, Math.max(0, Math.round(rating)))
}

/** Feedback entries for a member, newest first (REQ-FR-002). */
export async function getByMember(memberId: string): Promise<Feedback[]> {
  const entries = await listFeedbackByMember(memberId)
  return entries.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return b.id.localeCompare(a.id)
  })
}

/** Average rating for a member, null when they have no feedback (REQ-FR-003). */
export async function getAverageRating(memberId: string): Promise<number | null> {
  const entries = await listFeedbackByMember(memberId)
  if (entries.length === 0) {
    return null
  }
  const sum = entries.reduce((total, entry) => total + entry.rating, 0)
  return sum / entries.length
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  if (!input.content.trim()) {
    throw new Error("Feedback content is required.")
  }
  return insertFeedback({
    memberId: input.memberId,
    rating: clampRating(input.rating),
    content: input.content.trim(),
    category: input.category,
  })
}