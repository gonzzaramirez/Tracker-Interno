"use server"

/**
 * Time-off Server Action (task 7.2) — creates an entry and refreshes the
 * calendar page (REQ-CC-002).
 */

import { revalidatePath } from "next/cache"

import type { TimeOffEntry } from "@/lib/domain"
import { requestTimeOff, type RequestTimeOffInput } from "@/lib/services/calendar"
import { runActionResult, type ActionResult } from "@/lib/actions/result"

export async function requestTimeOffAction(
  input: RequestTimeOffInput
): Promise<ActionResult<TimeOffEntry>> {
  const result = await runActionResult(() => requestTimeOff(input))
  if (result.ok) {
    revalidatePath("/calendar")
  }
  return result
}