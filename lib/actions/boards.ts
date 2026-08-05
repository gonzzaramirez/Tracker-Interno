"use server"

import { revalidatePath } from "next/cache"

import type { Board, BoardScene } from "@/lib/domain"
import { createBoard, deleteBoard, renameBoard, saveBoardScene } from "@/lib/services/boards"
import { runActionResult, type ActionResult } from "@/lib/actions/result"
import { getCurrentUserId } from "@/lib/auth"

function revalidate(id?: string): void {
  revalidatePath("/boards")
  if (id) revalidatePath(`/boards/${id}`)
}

export async function createBoardAction(name: string): Promise<ActionResult<Board>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => createBoard(userId, name))
  if (result.ok) revalidate()
  return result
}

export async function renameBoardAction(id: string, name: string): Promise<ActionResult<Board>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(() => renameBoard(userId, id, name))
  if (result.ok) revalidate(id)
  return result
}

export async function saveBoardSceneAction(id: string, scene: BoardScene): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    await saveBoardScene(userId, id, scene)
    return null
  })
  // Autosave only needs the list to reflect the new updatedAt; revalidating
  // the editor page itself would re-render the RSC payload on every save.
  if (result.ok) revalidatePath("/boards")
  return result
}

export async function deleteBoardAction(id: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const result = await runActionResult(async () => {
    await deleteBoard(userId, id)
    return null
  })
  if (result.ok) revalidate(id)
  return result
}
