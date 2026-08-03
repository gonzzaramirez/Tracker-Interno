"use server"

/**
 * Time-off Server Actions — request, approve and reject persisted entries.
 */

import { revalidatePath } from "next/cache"

import type { TimeOffEntry } from "@/lib/domain"
import {
  approveTimeOff,
  rejectTimeOff,
  requestTimeOff,
  type RequestTimeOffInput,
} from "@/lib/services/timeoff"
import { runActionResult, type ActionResult } from "@/lib/actions/result"

function revalidateTimeOffPaths(memberId?: string): void {
  revalidatePath("/calendar")
  revalidatePath("/")
  revalidatePath("/members")
  if (memberId) {
    revalidatePath(`/members/${memberId}`)
  }
}

export async function requestTimeOffAction(
  input: RequestTimeOffInput
): Promise<ActionResult<TimeOffEntry>> {
  const result = await runActionResult(() => requestTimeOff(input))
  if (result.ok) {
    revalidateTimeOffPaths(input.memberId)
  }
  return result
}

export async function approveTimeOffAction(
  id: string,
): Promise<ActionResult<TimeOffEntry>> {
  const result = await runActionResult(() => approveTimeOff(id))
  if (result.ok) {
    revalidateTimeOffPaths(result.data.memberId)
  }
  return result
}

export async function rejectTimeOffAction(
  id: string,
): Promise<ActionResult<TimeOffEntry>> {
  const result = await runActionResult(() => rejectTimeOff(id))
  if (result.ok) {
    revalidateTimeOffPaths(result.data.memberId)
  }
  return result
}
