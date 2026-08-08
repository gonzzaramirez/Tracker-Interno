"use server"

import { getCurrentUserId } from "@/lib/auth"
import { getUserById, updateCelula } from "@/lib/db/repos/users"

const MAX_CELULA_LENGTH = 40

/**
 * Sets the cell name of the current supervisor (empty string clears it).
 * Supervisor-only: the PM has no cell of their own.
 */
export async function updateCelulaAction(
  celula: string,
): Promise<{ ok: true; celula: string | null } | { ok: false; error: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const user = await getUserById(userId)
  if (!user || user.role !== "supervisor") {
    return { ok: false, error: "Solo los supervisores pueden definir una célula." }
  }
  const trimmed = celula.trim()
  if (trimmed.length > MAX_CELULA_LENGTH) {
    return { ok: false, error: `El nombre de la célula no puede superar los ${MAX_CELULA_LENGTH} caracteres.` }
  }
  const value = trimmed || null
  await updateCelula(userId, value)
  return { ok: true, celula: value }
}
