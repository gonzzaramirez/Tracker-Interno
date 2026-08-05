/**
 * Users repository — supervisors (tenants). Seeded on first start.
 */
import { mutate, query, queryOne } from "../query"
import type { UserRow } from "../schema"
import type { User } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

export type NewUser = {
  id: string
  username: string
  passwordHash: string
}

function toUser(row: UserRow): User {
  return { id: row.id, username: row.username, createdAt: row.created_at }
}

export async function getUserById(id: string): Promise<User | undefined> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = ?", [id])
  return row ? toUser(row) : undefined
}

/** Full row including the password hash (auth only — never leak to UI). */
export async function getUserByUsername(username: string): Promise<(UserRow & { password_hash: string }) | undefined> {
  return queryOne<UserRow & { password_hash: string }>("SELECT * FROM users WHERE username = ?", [username])
}

export async function insertUser(input: NewUser): Promise<User> {
  const createdAt = todayISO()
  await mutate("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)", [input.id, input.username, input.passwordHash, createdAt])
  const user = await getUserById(input.id)
  if (!user) throw new Error(`User ${input.id} could not be read after insert.`)
  return user
}

export async function updatePassword(id: string, newHash: string): Promise<boolean> {
  const changes = await mutate("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, id])
  return changes > 0
}
