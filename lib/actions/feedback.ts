"use server"

/**
 * Feedback Server Action (task 5.2) — mutation in session + refresh
 * (REQ-CC-002).
 */

import { revalidatePath } from "next/cache"

import { createFeedback, type CreateFeedbackInput } from "@/lib/services/feedback"
import type { Feedback } from "@/lib/domain"
import { runActionResult, type ActionResult } from "@/lib/actions/result"

export async function createFeedbackAction(
  input: CreateFeedbackInput
): Promise<ActionResult<Feedback>> {
  const result = await runActionResult(() => createFeedback(input))
  if (result.ok) {
    revalidatePath("/feedback")
  }
  return result
}