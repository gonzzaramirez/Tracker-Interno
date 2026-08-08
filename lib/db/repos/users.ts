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

export type SupervisorOverview = {
  id: string
  username: string
  celula: string | null
  createdAt: string
  memberCount: number
  activeMemberCount: number
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    celula: row.celula,
    createdAt: row.created_at,
  }
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

/** Cell name for the current supervisor (null clears it). */
export async function updateCelula(id: string, celula: string | null): Promise<boolean> {
  const changes = await mutate("UPDATE users SET celula = ? WHERE id = ?", [celula, id])
  return changes > 0
}

/**
 * Cross-tenant listing for the PM: every supervisor with their cell name and
 * roster size. The first read path in the codebase that intentionally does
 * NOT filter by user_id — only callable behind requirePm().
 */
export async function listSupervisorsForPm(): Promise<SupervisorOverview[]> {
  return query<SupervisorOverview>(
    `SELECT u.id,
            u.username,
            u.celula,
            u.created_at AS createdAt,
            (SELECT COUNT(*) FROM members m WHERE m.user_id = u.id) AS memberCount,
            (SELECT COUNT(*) FROM members m WHERE m.user_id = u.id AND m.status = 'active') AS activeMemberCount
     FROM users u
     WHERE u.role = 'supervisor'
     ORDER BY u.username COLLATE NOCASE`,
  )
}
