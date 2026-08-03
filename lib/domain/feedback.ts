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
  /** Rating 1-5. */
  rating: number
  content: string
  category: FeedbackCategory
}
