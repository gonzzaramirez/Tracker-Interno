/** Feedback use cases over the SQLite repository. */

import { cache } from "react"

import type { Feedback, FeedbackCategory } from "@/lib/domain"
import { insertFeedback, listFeedbackByMember } from "@/lib/db/repos/feedback"

const readFeedbackByMember = cache(listFeedbackByMember)

export type CreateFeedbackInput = {
  memberId: string
  rating: number
  content: string
  category: FeedbackCategory
}

function normalizeRating(rating: number): number {
  if (!Number.isFinite(rating)) {
    throw new Error("Rating must be a number between 1 and 5.")
  }
  const normalized = Math.round(rating)
  if (normalized < 1 || normalized > 5) {
    throw new Error("Rating must be a number between 1 and 5.")
  }
  return normalized
}

export async function getByMember(memberId: string): Promise<Feedback[]> {
  const entries = await readFeedbackByMember(memberId)
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    if (a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt)
    }
    if (a.createdSequence !== b.createdSequence) {
      return b.createdSequence - a.createdSequence
    }
    return b.id.localeCompare(a.id)
  })
}

export async function getAverageRating(memberId: string): Promise<number | null> {
  const entries = await readFeedbackByMember(memberId)
  if (entries.length === 0) {
    return null
  }
  return entries.reduce((total, entry) => total + entry.rating, 0) / entries.length
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  if (!input.content.trim()) {
    throw new Error("Feedback content is required.")
  }
  return insertFeedback({
    memberId: input.memberId,
    rating: normalizeRating(input.rating),
    content: input.content.trim(),
    category: input.category,
  })
}
