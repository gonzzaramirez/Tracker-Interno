/**
 * Users repository — raw SQL over the shared connection.
 *
 * Users are supervisors (tenants). They are seeded on first start; no public
 * registration endpoint exists.
 */

import { getDb } from "../connection"
import type { UserRow } from "../schema"
import type { User } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

export type NewUser = {
  id: string
  username: string
  passwordHash: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined
  return row ? toUser(row) : undefined
}

export async function getUserByUsername(username: string): Promise<(UserRow & { password_hash: string }) | undefined> {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as (UserRow & { password_hash: string }) | undefined
}

export async function insertUser(input: NewUser): Promise<User> {
  const createdAt = todayISO()
  getDb()
    .prepare("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(input.id, input.username, input.passwordHash, createdAt)
  const user = await getUserById(input.id)
  if (!user) {
    throw new Error(`User ${input.id} could not be read after insert.`)
  }
  return user
}

export async function updatePassword(id: string, newHash: string): Promise<boolean> {
  const result = getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(newHash, id)
  return Number(result.changes) > 0
}
