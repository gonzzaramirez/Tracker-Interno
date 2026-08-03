/**
 * Members repository (task 1.5) — raw SQL over the shared connection.
 * Prepared statements, rows mapped to domain types. The only async boundary
 * the services depend on (CC-001).
 */
import { getDb } from "../connection"
import type { MemberRow } from "../schema"
import type { Member, MemberStatus } from "@/lib/domain"

export type StoredMember = Member & {
  checkinFreqDays: number
  lastCheckinAt?: string
  nextCheckinAt: string
}

function toMember(row: MemberRow): StoredMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    displayColor: row.display_color,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
    notes: row.notes ?? undefined,
    checkinFreqDays: row.checkin_freq_days,
    lastCheckinAt: row.last_checkin_at ?? undefined,
    nextCheckinAt: row.next_checkin_at,
  }
}

export async function listMembers(): Promise<StoredMember[]> {
  const rows = getDb()
    .prepare("SELECT * FROM members ORDER BY joined_at ASC")
    .all() as MemberRow[]
  return rows.map(toMember)
}

export async function getMemberById(id: string): Promise<StoredMember | undefined> {
  const row = getDb().prepare("SELECT * FROM members WHERE id = ?").get(id) as
    | MemberRow
    | undefined
  return row ? toMember(row) : undefined
}
