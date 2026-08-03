/**
 * Pure domain types — member feedback entries.
 */

export const FEEDBACK_CATEGORIES = ["praise", "coaching", "concern"] as const

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export type Feedback = {
  id: string
  memberId: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** ISO timestamp used to order entries created on the same date. */
  createdAt: string
  /** Persistent insertion sequence used as the final stable tie-breaker. */
  createdSequence: number
  /** Rating 1-5. */
  rating: number
  content: string
  category: FeedbackCategory
}
