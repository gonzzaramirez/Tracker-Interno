/**
 * Time-off repository — per-tenant absences.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { TimeOffRow } from "../schema"
import type { TimeOff, TimeOffStatus, TimeOffType } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

export type NewTimeOff = { memberId: string; startDate: string; endDate: string; type: TimeOffType; note?: string }
export type UpdateTimeOff = { status: TimeOffStatus }

function toTimeOff(row: TimeOffRow): TimeOff {
  return { id: row.id, memberId: row.member_id, startDate: row.start_date, endDate: row.end_date, type: row.type as TimeOffType, status: row.status as TimeOffStatus, note: row.note ?? undefined, createdAt: row.created_at }
}

export async function listTimeOffByMember(userId: string, memberId: string): Promise<TimeOff[]> {
  const rows = getDb().prepare("SELECT * FROM time_off WHERE user_id = ? AND member_id = ? ORDER BY start_date DESC").all(userId, memberId) as TimeOffRow[]
  return rows.map(toTimeOff)
}

export async function insertTimeOff(userId: string, input: NewTimeOff): Promise<TimeOff> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  getDb().prepare("INSERT INTO time_off (id, user_id, member_id, start_date, end_date, type, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)").run(id, userId, input.memberId, input.startDate, input.endDate, input.type, input.note ?? null, createdAt)
  const row = getDb().prepare("SELECT * FROM time_off WHERE user_id = ? AND id = ?").get(userId, id) as TimeOffRow | undefined
  if (!row) throw new Error(`Time-off ${id} could not be read after insert.`)
  return toTimeOff(row)
}

export async function updateTimeOffStatus(userId: string, id: string, status: TimeOffStatus): Promise<TimeOff | undefined> {
  getDb().prepare("UPDATE time_off SET status = ? WHERE user_id = ? AND id = ?").run(status, userId, id)
  const row = getDb().prepare("SELECT * FROM time_off WHERE user_id = ? AND id = ?").get(userId, id) as TimeOffRow | undefined
  return row ? toTimeOff(row) : undefined
}

export async function deleteTimeOff(userId: string, id: string): Promise<boolean> {
  const result = getDb().prepare("DELETE FROM time_off WHERE user_id = ? AND id = ?").run(userId, id)
  return Number(result.changes) > 0
}
