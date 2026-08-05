/**
 * Time-off repository — per-tenant absences.
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
import type { TimeOffRow } from "../schema"
import type { TimeOff, TimeOffStatus, TimeOffType } from "@/lib/domain"

export type NewTimeOff = { memberId: string; startDate: string; endDate: string; type: TimeOffType; note?: string }
export type UpdateTimeOff = { status: TimeOffStatus }

function toTimeOff(row: TimeOffRow): TimeOff {
  return {
    id: row.id,
    memberId: row.member_id,
    startDate: row.start_date,
    endDate: row.end_date,
    type: row.type as TimeOffType,
    status: row.status as TimeOffStatus,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listTimeOffByMember(userId: string, memberId: string): Promise<TimeOff[]> {
  const rows = await query<TimeOffRow>("SELECT * FROM time_off WHERE user_id = ? AND member_id = ? ORDER BY start_date DESC", [userId, memberId])
  return rows.map(toTimeOff)
}

export async function insertTimeOff(userId: string, input: NewTimeOff): Promise<TimeOff> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  await mutate(
    "INSERT INTO time_off (id, user_id, member_id, start_date, end_date, type, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)",
    [id, userId, input.memberId, input.startDate, input.endDate, input.type, input.note ?? null, createdAt],
  )
  const row = await queryOne<TimeOffRow>("SELECT * FROM time_off WHERE user_id = ? AND id = ?", [userId, id])
  if (!row) throw new Error(`Time-off ${id} could not be read after insert.`)
  return toTimeOff(row)
}

export async function updateTimeOffStatus(userId: string, id: string, status: TimeOffStatus): Promise<TimeOff | undefined> {
  await mutate("UPDATE time_off SET status = ? WHERE user_id = ? AND id = ?", [status, userId, id])
  const row = await queryOne<TimeOffRow>("SELECT * FROM time_off WHERE user_id = ? AND id = ?", [userId, id])
  return row ? toTimeOff(row) : undefined
}

export async function deleteTimeOff(userId: string, id: string): Promise<boolean> {
  const changes = await mutate("DELETE FROM time_off WHERE user_id = ? AND id = ?", [userId, id])
  return changes > 0
}
