"use server"

import { revalidatePath } from "next/cache"

import type { TimeOff } from "@/lib/domain"
import { createTimeOff, deleteTimeOff, approveTimeOff, rejectTimeOff } from "@/lib/services/timeoff"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"

type CreateInput = { memberId: string; startDate: string; endDate: string; type: "vacation" | "license" | "sickness" | "holiday"; note?: string }

function revalidate(): void { revalidatePath("/calendar"); revalidatePath("/"); revalidatePath("/members") }

export async function requestTimeOffAction(input: CreateInput): Promise<ActionResult<TimeOff>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createTimeOff(userId, input))
  if (result.ok) { revalidate(); revalidatePath(`/members/${input.memberId}`) }
  return result
}

export async function approveTimeOffAction(id: string): Promise<ActionResult<TimeOff>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => approveTimeOff(userId, id))
  if (result.ok) revalidate()
  return result
}

export async function rejectTimeOffAction(id: string): Promise<ActionResult<TimeOff>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => rejectTimeOff(userId, id))
  if (result.ok) revalidate()
  return result
}

export async function deleteTimeOffAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await deleteTimeOff(userId, id); return null })
  if (result.ok) revalidate()
  return result
}
