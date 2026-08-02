/**
 * FUTURE HTTP contract for the feedback capability (task 1.5).
 *
 * DEFINED but NEVER invoked — documents the swap shape only (REQ-CC-001).
 */

import type { Feedback, FeedbackCategory } from "@/lib/domain"

export type CreateFeedbackInput = {
  memberId: string
  rating: number
  content: string
  category: FeedbackCategory
}

export interface FeedbackApi {
  getByMember: (memberId: string) => Promise<Feedback[]>
  getAverageRating: (memberId: string) => Promise<number | null>
  createFeedback: (input: CreateFeedbackInput) => Promise<Feedback>
}

export const feedbackApi: FeedbackApi = {
  async getByMember() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getAverageRating() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async createFeedback() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}