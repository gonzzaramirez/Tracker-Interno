"use server"

import { redirect } from "next/navigation"

import { getUserById, getUserByUsername } from "@/lib/db/repos/users"
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUserId } from "@/lib/auth"
import { updatePassword } from "@/lib/db/repos/users"

export async function loginAction(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUserByUsername(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { ok: false, error: "Usuario o contraseña incorrectos." }
  }
  await createSession(user.id)
  return { ok: true }
}

export async function signOutAction(): Promise<void> {
  await destroySession()
  redirect("/login")
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: "No autenticado." }
  const user = await getUserById(userId)
  if (!user) return { ok: false, error: "Usuario no encontrado." }
  const stored = await getUserByUsername(user.username)
  if (!stored || !verifyPassword(currentPassword, stored.password_hash)) return { ok: false, error: "Contraseña actual incorrecta." }
  if (!newPassword || newPassword.length < 4) return { ok: false, error: "La nueva contraseña debe tener al menos 4 caracteres." }
  await updatePassword(userId, hashPassword(newPassword))
  return { ok: true }
}
