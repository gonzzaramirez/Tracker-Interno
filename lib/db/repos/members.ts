/**
 * Members repository — queries over the shared client, filtered by tenant.
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
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
  const rows = await query<MemberRow>("SELECT * FROM members WHERE user_id = ? ORDER BY joined_at ASC", [userId])
  return rows.map(toMember)
}

export async function getMemberById(userId: string, id: string): Promise<StoredMember | undefined> {
  const row = await queryOne<MemberRow>("SELECT * FROM members WHERE user_id = ? AND id = ?", [userId, id])
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
  await mutate(
    `INSERT INTO members
     (id, user_id, name, role, display_color, status, joined_at, notes, checkin_freq_days, last_checkin_at, next_checkin_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 30, NULL, ?)`,
    [id, userId, input.name, input.role, input.displayColor ?? null, input.status, input.joinedAt, input.notes ?? null, input.joinedAt],
  )
  const row = await queryOne<MemberRow>("SELECT * FROM members WHERE user_id = ? AND id = ?", [userId, id])
  if (!row) throw new Error(`Member ${id} could not be read after insert.`)
  return toMember(row)
}

export async function updateMember(userId: string, id: string, input: MemberInput): Promise<StoredMember | undefined> {
  const changes = await mutate(
    `UPDATE members SET name = ?, role = ?, status = ?, joined_at = ?, display_color = ?, notes = ?
     WHERE user_id = ? AND id = ?`,
    [input.name, input.role, input.status, input.joinedAt, input.displayColor ?? null, input.notes ?? null, userId, id],
  )
  if (changes === 0) return undefined
  const row = await queryOne<MemberRow>("SELECT * FROM members WHERE user_id = ? AND id = ?", [userId, id])
  return row ? toMember(row) : undefined
}

export async function searchMembers(userId: string, queryText: string): Promise<StoredMember[]> {
  const rows = await query<MemberRow>(
    "SELECT * FROM members WHERE user_id = ? AND (name LIKE ? OR role LIKE ?) ORDER BY joined_at ASC",
    [userId, `%${queryText}%`, `%${queryText}%`],
  )
  return rows.map(toMember)
}
