/**
 * Members repository — raw SQL over the shared connection, filtered by tenant.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { MemberRow } from "../schema"
import type { Member, MemberStatus } from "@/lib/domain"

export type StoredMember = Member

function toMember(row: MemberRow): StoredMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
    displayColor: row.display_color ?? undefined,
    notes: row.notes ?? undefined,
  }
}

export async function listMembers(userId: string): Promise<StoredMember[]> {
  const rows = getDb()
    .prepare("SELECT * FROM members WHERE user_id = ? ORDER BY joined_at ASC")
    .all(userId) as MemberRow[]
  return rows.map(toMember)
}

export async function getMemberById(userId: string, id: string): Promise<StoredMember | undefined> {
  const row = getDb()
    .prepare("SELECT * FROM members WHERE user_id = ? AND id = ?")
    .get(userId, id) as MemberRow | undefined
  return row ? toMember(row) : undefined
}

export type MemberInput = {
  name: string
  role: string
  status: MemberStatus
  joinedAt: string
  displayColor?: string
  notes?: string
}

export async function insertMember(userId: string, input: MemberInput): Promise<StoredMember> {
  const id = randomUUID()
  const db = getDb()
  db.prepare(
    `INSERT INTO members
     (id, user_id, name, role, display_color, status, joined_at, notes, checkin_freq_days, last_checkin_at, next_checkin_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 30, NULL, ?)`,
  ).run(id, userId, input.name, input.role, input.displayColor ?? null, input.status, input.joinedAt, input.notes ?? null, input.joinedAt)
  const row = db.prepare("SELECT * FROM members WHERE user_id = ? AND id = ?").get(userId, id) as MemberRow | undefined
  if (!row) throw new Error(`Member ${id} could not be read after insert.`)
  return toMember(row)
}

export async function updateMember(userId: string, id: string, input: MemberInput): Promise<StoredMember | undefined> {
  const db = getDb()
  const result = db
    .prepare(
      `UPDATE members SET name = ?, role = ?, status = ?, joined_at = ?, display_color = ?, notes = ?
       WHERE user_id = ? AND id = ?`,
    )
    .run(input.name, input.role, input.status, input.joinedAt, input.displayColor ?? null, input.notes ?? null, userId, id)
  if (result.changes === 0) return undefined
  const row = db.prepare("SELECT * FROM members WHERE user_id = ? AND id = ?").get(userId, id) as MemberRow | undefined
  return row ? toMember(row) : undefined
}

export async function searchMembers(userId: string, query: string): Promise<StoredMember[]> {
  const rows = getDb()
    .prepare("SELECT * FROM members WHERE user_id = ? AND (name LIKE ? OR role LIKE ?) ORDER BY joined_at ASC")
    .all(userId, `%${query}%`, `%${query}%`) as MemberRow[]
  return rows.map(toMember)
}
