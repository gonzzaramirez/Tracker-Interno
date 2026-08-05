/**
 * Attendance repository — daily presence marks per tenant.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { AttendanceRow } from "../schema"
import type { Attendance } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

function toAttendance(row: AttendanceRow): Attendance {
  return { id: row.id, memberId: row.member_id, date: row.date, markedAt: row.marked_at ?? null, createdAt: row.created_at }
}

export async function listAttendanceByMember(userId: string, memberId: string): Promise<Attendance[]> {
  const rows = getDb().prepare("SELECT * FROM attendance WHERE user_id = ? AND member_id = ? ORDER BY date DESC, created_at DESC").all(userId, memberId) as AttendanceRow[]
  return rows.map(toAttendance)
}

export async function listAttendanceByDate(userId: string, date: string): Promise<Attendance[]> {
  const rows = getDb().prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ? ORDER BY created_at ASC").all(userId, date) as AttendanceRow[]
  return rows.map(toAttendance)
}

export async function markAttendance(userId: string, memberId: string, date: string, markedAt: string): Promise<Attendance> {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND member_id = ? AND date = ?").get(userId, memberId, date) as AttendanceRow | undefined
  if (existing) {
    db.prepare("UPDATE attendance SET marked_at = ? WHERE user_id = ? AND id = ?").run(markedAt, userId, existing.id)
    return { ...toAttendance(existing), markedAt }
  }
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare("INSERT INTO attendance (id, user_id, member_id, date, marked_at, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, userId, memberId, date, markedAt, createdAt)
  const row = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND id = ?").get(userId, id) as AttendanceRow | undefined
  if (!row) throw new Error(`Attendance ${id} could not be read after insert.`)
  return toAttendance(row)
}

export async function unmarkAttendance(userId: string, memberId: string, date: string): Promise<boolean> {
  const result = getDb().prepare("DELETE FROM attendance WHERE user_id = ? AND member_id = ? AND date = ?").run(userId, memberId, date)
  return Number(result.changes) > 0
}
