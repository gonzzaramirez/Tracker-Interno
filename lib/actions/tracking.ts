"use server"

import { revalidatePath } from "next/cache"

import type { TrackingRecord } from "@/lib/domain"
import {
  createTrackingRecord,
  updateTrackingRecord,
  deleteTrackingRecord,
  type CreateTrackingInput,
  type UpdateTrackingInput,
} from "@/lib/services/tracking"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"

function revalidate(): void {
  revalidatePath("/")
  revalidatePath("/members")
  revalidatePath("/tracking")
  revalidatePath("/tracking/[memberId]")
  revalidatePath("/members/[id]")
}

export async function createTrackingRecordAction(input: CreateTrackingInput): Promise<ActionResult<TrackingRecord>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createTrackingRecord(userId, input))
  if (result.ok) revalidate()
  return result
}

export async function updateTrackingRecordAction(id: string, input: UpdateTrackingInput): Promise<ActionResult<TrackingRecord>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => updateTrackingRecord(userId, id, input))
  if (result.ok) revalidate()
  return result
}

export async function deleteTrackingRecordAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await deleteTrackingRecord(userId, id); return null })
  if (result.ok) revalidate()
  return result
}
