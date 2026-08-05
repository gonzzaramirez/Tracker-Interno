"use server"

import { revalidatePath } from "next/cache"

import type { Member } from "@/lib/domain"
import { createMember, editMember } from "@/lib/services/members"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"
import type { CreateMemberInput, UpdateMemberInput } from "@/lib/services/members"

function revalidate(id?: string): void {
  revalidatePath("/members")
  revalidatePath("/")
  if (id) revalidatePath(`/members/${id}`)
}

export async function createMemberAction(input: CreateMemberInput): Promise<ActionResult<Member>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createMember(userId, input))
  if (result.ok) revalidate()
  return result
}

export async function updateMemberAction(id: string, input: UpdateMemberInput): Promise<ActionResult<Member>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    const updated = await editMember(userId, id, input)
    if (!updated) throw new Error("Miembro no encontrado.")
    return updated
  })
  if (result.ok) revalidate(id)
  return result
}

export async function deactivateMemberAction(id: string): Promise<ActionResult<Member>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    const updated = await editMember(userId, id, { status: "recess" })
    if (!updated) throw new Error("Miembro no encontrado.")
    return updated
  })
  if (result.ok) revalidate(id)
  return result
}
