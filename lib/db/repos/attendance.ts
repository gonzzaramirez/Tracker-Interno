/**
 * Attendance repository — daily presence marks per tenant.
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
import type { AttendanceRow } from "../schema"
import type { Attendance } from "@/lib/domain"

function toAttendance(row: AttendanceRow): Attendance {
  return { id: row.id, memberId: row.member_id, date: row.date, markedAt: row.marked_at ?? null, createdAt: row.created_at }
}

export async function listAttendanceByMember(userId: string, memberId: string): Promise<Attendance[]> {
  const rows = await query<AttendanceRow>("SELECT * FROM attendance WHERE user_id = ? AND member_id = ? ORDER BY date DESC, created_at DESC", [userId, memberId])
  return rows.map(toAttendance)
}

export async function listAttendanceByDate(userId: string, date: string): Promise<Attendance[]> {
  const rows = await query<AttendanceRow>("SELECT * FROM attendance WHERE user_id = ? AND date = ? ORDER BY created_at ASC", [userId, date])
  return rows.map(toAttendance)
}

export async function markAttendance(userId: string, memberId: string, date: string, markedAt: string): Promise<Attendance> {
  const existing = await queryOne<AttendanceRow>("SELECT * FROM attendance WHERE user_id = ? AND member_id = ? AND date = ?", [userId, memberId, date])
  if (existing) {
    await mutate("UPDATE attendance SET marked_at = ? WHERE user_id = ? AND id = ?", [markedAt, userId, existing.id])
    return { ...toAttendance(existing), markedAt }
  }
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  await mutate("INSERT INTO attendance (id, user_id, member_id, date, marked_at, created_at) VALUES (?, ?, ?, ?, ?, ?)", [id, userId, memberId, date, markedAt, createdAt])
  const row = await queryOne<AttendanceRow>("SELECT * FROM attendance WHERE user_id = ? AND id = ?", [userId, id])
  if (!row) throw new Error(`Attendance ${id} could not be read after insert.`)
  return toAttendance(row)
}

export async function unmarkAttendance(userId: string, memberId: string, date: string): Promise<boolean> {
  const changes = await mutate("DELETE FROM attendance WHERE user_id = ? AND member_id = ? AND date = ?", [userId, memberId, date])
  return changes > 0
}
