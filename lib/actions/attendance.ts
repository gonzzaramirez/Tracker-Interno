"use server"

import { revalidatePath } from "next/cache"

import { mark, unmark } from "@/lib/services/attendance"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"

const PATHS = ["/", "/members", "/asistencias"]

function revalidateAtt(memberId: string): void {
  for (const path of PATHS) revalidatePath(path)
  revalidatePath(`/members/${memberId}`)
}

export async function markAttendanceAction(memberId: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await mark(userId, memberId); return null })
  if (result.ok) revalidateAtt(memberId)
  return result
}

export async function unmarkAttendanceAction(memberId: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => { await unmark(userId, memberId); return null })
  if (result.ok) revalidateAtt(memberId)
  return result
}
