/**
 * Time-off repository (task 1.6) — raw SQL over the shared connection.
 *
 * Approve/reject mutate a row only while it is still `pending`, so a stale
 * request cannot double-approve (design D5).
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { TimeOffRow, TimeOffStatus, TimeOffType } from "../schema"
import { todayISO } from "@/lib/domain/date"

export type StoredTimeOffEntry = {
  id: string
  memberId: string
  startDate: string
  endDate: string
  type: TimeOffType
  status: TimeOffStatus
  note?: string
  createdAt: string
}

function toEntry(row: TimeOffRow): StoredTimeOffEntry {
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

export type NewTimeOff = Omit<StoredTimeOffEntry, "id" | "createdAt" | "status"> & {
  status?: TimeOffStatus
}

export async function listTimeOff(): Promise<StoredTimeOffEntry[]> {
  const rows = getDb()
    .prepare("SELECT * FROM time_off ORDER BY start_date ASC, created_at ASC")
    .all() as TimeOffRow[]
  return rows.map(toEntry)
}

export async function listTimeOffByMember(memberId: string): Promise<StoredTimeOffEntry[]> {
  const rows = getDb()
    .prepare("SELECT * FROM time_off WHERE member_id = ? ORDER BY start_date ASC")
    .all(memberId) as TimeOffRow[]
  return rows.map(toEntry)
}

export async function getTimeOffById(id: string): Promise<StoredTimeOffEntry | undefined> {
  const row = getDb().prepare("SELECT * FROM time_off WHERE id = ?").get(id) as
    | TimeOffRow
    | undefined
  return row ? toEntry(row) : undefined
}

export async function insertTimeOff(input: NewTimeOff): Promise<StoredTimeOffEntry> {
  if (input.endDate < input.startDate) {
    throw new RangeError("The end date cannot be before the start date.")
  }

  const id = randomUUID()
  const createdAt = todayISO()
  getDb()
    .prepare(
      `INSERT INTO time_off (id, member_id, start_date, end_date, type, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.memberId,
      input.startDate,
      input.endDate,
      input.type,
      input.status ?? "pending",
      input.note ?? null,
      createdAt
    )
  const row = getDb().prepare("SELECT * FROM time_off WHERE id = ?").get(id) as
    | TimeOffRow
    | undefined
  if (!row) {
    throw new Error(`Time-off entry ${id} could not be read after insert.`)
  }
  return toEntry(row)
}

/** Approves a pending entry; false when it is gone/stale (never double-approve). */
export async function approveTimeOff(id: string): Promise<boolean> {
  const result = getDb()
    .prepare("UPDATE time_off SET status = 'approved' WHERE id = ? AND status = 'pending'")
    .run(id)
  return Number(result.changes) > 0
}

/** Rejects a pending entry; false when it is gone/stale. */
export async function rejectTimeOff(id: string): Promise<boolean> {
  const result = getDb()
    .prepare("UPDATE time_off SET status = 'rejected' WHERE id = ? AND status = 'pending'")
    .run(id)
  return Number(result.changes) > 0
}
