"use server"

/** Server Actions for persistent check-in mutations. */

import { revalidatePath } from "next/cache"

import type { Member } from "@/lib/domain"
import {
  completeCheckIn,
  updateCheckInConfig,
  type CompleteCheckInInput,
} from "@/lib/services/checkins"
import { runActionResult, type ActionResult } from "@/lib/actions/result"

export async function completeCheckInAction(
  input: CompleteCheckInInput,
): Promise<ActionResult<Member>> {
  const result = await runActionResult(() => completeCheckIn(input))
  if (result.ok) {
    revalidatePath("/")
    revalidatePath(`/members/${input.memberId}`)
  }
  return result
}

export async function updateCheckInConfigAction(
  memberId: string,
  freqDays: number,
): Promise<ActionResult<Member>> {
  const result = await runActionResult(() => updateCheckInConfig(memberId, freqDays))
  if (result.ok) {
    revalidatePath("/")
    revalidatePath(`/members/${memberId}`)
  }
  return result
}
