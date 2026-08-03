/**
 * Check-in repository (task 1.6) — raw SQL over the shared connection.
 *
 * `markCheckIn` runs both writes inside a single transaction (D5): it appends
 * a row to `check_ins` and materializes `last_checkin_at` +
 * `next_checkin_at` on the member.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { CheckInRow, MemberRow, Semaphore } from "../schema"
import type { MemberStatus } from "@/lib/domain"
import { addDays, todayISO } from "@/lib/domain/date"
import type { StoredMember } from "./members"

export type CheckInRecord = {
  id: string
  memberId: string
  date: string
  semaphore: Semaphore | null
  note?: string
  createdAt: string
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

export type NewCheckIn = {
  memberId: string
  date?: string
  semaphore?: Semaphore
  note?: string
}

/** List members whose next check-in is on/before `today` (banner WD-004). */
export async function listDueCheckIns(todayISO: string): Promise<StoredMember[]> {
  const rows = getDb()
    .prepare(
      `SELECT * FROM members
       WHERE next_checkin_at <= ?
       ORDER BY next_checkin_at ASC`
    )
    .all(todayISO) as MemberRow[]
  return rows.map(toMember)
}

/**
 * Persists a completed check-in atomically: append `check_ins` row and advance
 * `last_checkin_at` / `next_checkin_at` on the member (MF-004/005).
 */
export async function markCheckIn(input: NewCheckIn): Promise<void> {
  const db = getDb()
  const today = input.date ?? todayISO()
  const id = randomUUID()
  db.exec("BEGIN")
  try {
    const member = db
      .prepare("SELECT * FROM members WHERE id = ?")
      .get(input.memberId) as MemberRow | undefined

    if (!member) {
      throw new Error("Member not found.")
    }

    db.prepare(
      `INSERT INTO check_ins (id, member_id, checkin_date, semaphore, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, input.memberId, today, input.semaphore ?? null, input.note ?? null, today)

    db.prepare(
      `UPDATE members
       SET last_checkin_at = ?,
           next_checkin_at = ?
       WHERE id = ?`
    ).run(today, addDays(today, member.checkin_freq_days), input.memberId)

    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}

/** Update the per-member check-in frequency suffix (MF-004). */
export async function updateCheckInFrequency(
  memberId: string,
  freqDays: number
): Promise<void> {
  if (!Number.isInteger(freqDays) || freqDays <= 0) {
    throw new RangeError("Check-in frequency must be a positive integer.")
  }

  const db = getDb()
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(memberId) as
    | MemberRow
    | undefined
  if (!member) {
    throw new Error("Member not found.")
  }

  const baseDate = member.last_checkin_at ?? member.joined_at
  db.prepare(
    "UPDATE members SET checkin_freq_days = ?, next_checkin_at = ? WHERE id = ?",
  ).run(freqDays, addDays(baseDate, freqDays), memberId)
}

function toCheckIn(row: CheckInRow): CheckInRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    date: row.checkin_date,
    semaphore: row.semaphore,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listCheckInsByMember(memberId: string): Promise<CheckInRecord[]> {
  const rows = getDb()
    .prepare(
      `SELECT * FROM check_ins
       WHERE member_id = ?
       ORDER BY checkin_date DESC, created_at DESC`
    )
    .all(memberId) as CheckInRow[]
  return rows.map(toCheckIn)
}
