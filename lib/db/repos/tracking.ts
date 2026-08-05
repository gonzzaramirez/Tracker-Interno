/**
 * Tracking repository (core) — raw SQL over the shared connection, filtered by tenant.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type {
  TrackingRecordRow,
  TrackingTaskRow,
  TrackingEvaluationRow,
  EvaluationAreaId,
} from "../schema"
import type { TrackingRecord, TrackingTask, TrackingEvaluation } from "@/lib/domain"
import { EVALUATION_AREAS } from "@/lib/domain/tracking"
import { isISODate, todayISO } from "@/lib/domain/date"
import { nextSequence } from "./sequence"

export type NewTrackingTask = {
  title: string
  description?: string
  progress?: number
}

export type NewTrackingEvaluation = {
  areaId: EvaluationAreaId
  score: number
  maxScore?: number
  weight?: number
}

export type NewTrackingRecord = {
  memberId: string
  rating: number | null
  contentHtml: string
  recordDate?: string
}

export type UpdateTrackingRecord = {
  rating?: number | null
  contentHtml?: string
  recordDate?: string
}

function toRecord(row: TrackingRecordRow): TrackingRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    rating: row.rating,
    contentHtml: row.content_html,
    recordDate: row.record_date,
    createdAt: row.created_at,
    createdSequence: row.created_sequence,
    updatedAt: row.updated_at ?? undefined,
  }
}

function toTask(row: TrackingTaskRow): TrackingTask {
  return {
    id: row.id,
    recordId: row.record_id,
    title: row.title,
    description: row.description ?? undefined,
    progress: row.progress,
    createdAt: row.created_at,
  }
}

export type TrackingEvaluationWithRecord = TrackingEvaluation & { recordId: string }

function toEvaluation(row: TrackingEvaluationRow): TrackingEvaluationWithRecord {
  return {
    recordId: row.record_id,
    areaId: row.area_id,
    score: row.score,
    maxScore: row.max_score,
    weight: row.weight,
  }
}

export async function listTrackingRecords(userId: string): Promise<TrackingRecord[]> {
  const rows = getDb()
    .prepare("SELECT * FROM tracking_records WHERE user_id = ? ORDER BY created_at DESC, created_sequence DESC, id DESC")
    .all(userId) as TrackingRecordRow[]
  return rows.map(toRecord)
}

export async function listTrackingByMember(userId: string, memberId: string): Promise<TrackingRecord[]> {
  const rows = getDb()
    .prepare("SELECT * FROM tracking_records WHERE user_id = ? AND member_id = ? ORDER BY created_at DESC, created_sequence DESC, id DESC")
    .all(userId, memberId) as TrackingRecordRow[]
  return rows.map(toRecord)
}

export async function getTrackingById(userId: string, id: string): Promise<TrackingRecord | undefined> {
  const row = getDb()
    .prepare("SELECT * FROM tracking_records WHERE user_id = ? AND id = ?")
    .get(userId, id) as TrackingRecordRow | undefined
  return row ? toRecord(row) : undefined
}

export async function insertTrackingRecord(userId: string, input: NewTrackingRecord): Promise<TrackingRecord> {
  if (input.rating !== null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    throw new RangeError("Rating must be an integer between 1 and 5, or null.")
  }
  if (input.recordDate !== undefined && !isISODate(input.recordDate)) {
    throw new RangeError("Record date must use the YYYY-MM-DD format.")
  }

  const id = randomUUID()
  const db = getDb()
  const createdAt = new Date().toISOString()
  const recordDate = input.recordDate ?? todayISO()
  const createdSequence = nextSequence(db, "tracking_records")
  db.prepare(
    `INSERT INTO tracking_records
     (id, user_id, member_id, rating, content_html, record_date, created_at, created_sequence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, input.memberId, input.rating, input.contentHtml, recordDate, createdAt, createdSequence)
  const row = db.prepare("SELECT * FROM tracking_records WHERE user_id = ? AND id = ?").get(userId, id) as TrackingRecordRow | undefined
  if (!row) throw new Error(`Tracking record ${id} could not be read after insert.`)
  return toRecord(row)
}

export async function updateTrackingRecord(userId: string, id: string, patch: UpdateTrackingRecord): Promise<TrackingRecord | undefined> {
  const entries: Array<{ column: string; value: string | number | null }> = []
  if (patch.rating !== undefined) {
    if (patch.rating !== null && (!Number.isInteger(patch.rating) || patch.rating < 1 || patch.rating > 5)) {
      throw new RangeError("Rating must be an integer between 1 and 5, or null.")
    }
    entries.push({ column: "rating", value: patch.rating })
  }
  if (patch.contentHtml !== undefined) entries.push({ column: "content_html", value: patch.contentHtml })
  if (patch.recordDate !== undefined) {
    if (!isISODate(patch.recordDate)) throw new RangeError("Record date must use the YYYY-MM-DD format.")
    entries.push({ column: "record_date", value: patch.recordDate })
  }
  if (entries.length === 0) return getTrackingById(userId, id)
  entries.push({ column: "updated_at", value: new Date().toISOString() })
  const setClause = entries.map(({ column }) => `${column} = ?`).join(", ")
  getDb().prepare(`UPDATE tracking_records SET ${setClause} WHERE user_id = ? AND id = ?`).run(...entries.map(({ value }) => value), userId, id)
  return getTrackingById(userId, id)
}

export async function deleteTrackingRecord(userId: string, id: string): Promise<boolean> {
  const result = getDb().prepare("DELETE FROM tracking_records WHERE user_id = ? AND id = ?").run(userId, id)
  return Number(result.changes) > 0
}

export async function listTrackingTasksByRecords(userId: string, recordIds: string[]): Promise<TrackingTask[]> {
  if (recordIds.length === 0) return []
  const placeholders = recordIds.map(() => "?").join(", ")
  const rows = getDb()
    .prepare(`SELECT * FROM tracking_tasks WHERE user_id = ? AND record_id IN (${placeholders}) ORDER BY created_at ASC, id ASC`)
    .all(userId, ...recordIds) as TrackingTaskRow[]
  return rows.map(toTask)
}

export async function insertTrackingTask(userId: string, recordId: string, input: NewTrackingTask): Promise<TrackingTask> {
  if (!input.title.trim()) throw new RangeError("Task title is required.")
  const progress = input.progress ?? 0
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw new RangeError("Progress must be between 0 and 100.")
  const id = randomUUID()
  const createdAt = todayISO()
  getDb()
    .prepare(`INSERT INTO tracking_tasks (id, user_id, record_id, title, description, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, recordId, input.title.trim(), input.description?.trim() || null, Math.round(progress), createdAt)
  const row = getDb().prepare("SELECT * FROM tracking_tasks WHERE user_id = ? AND id = ?").get(userId, id) as TrackingTaskRow | undefined
  if (!row) throw new Error(`Tracking task ${id} could not be read after insert.`)
  return toTask(row)
}

export async function deleteTrackingTask(userId: string, id: string): Promise<boolean> {
  const result = getDb().prepare("DELETE FROM tracking_tasks WHERE user_id = ? AND id = ?").run(userId, id)
  return Number(result.changes) > 0
}

export async function listEvaluationsByRecords(userId: string, recordIds: string[]): Promise<TrackingEvaluationWithRecord[]> {
  if (recordIds.length === 0) return []
  const placeholders = recordIds.map(() => "?").join(", ")
  const rows = getDb()
    .prepare(`SELECT * FROM tracking_evaluations WHERE user_id = ? AND record_id IN (${placeholders}) ORDER BY area_id ASC, id ASC`)
    .all(userId, ...recordIds) as TrackingEvaluationRow[]
  return rows.map(toEvaluation)
}

export async function replaceTrackingEvaluations(userId: string, recordId: string, items: NewTrackingEvaluation[]): Promise<void> {
  const db = getDb()
  db.prepare("DELETE FROM tracking_evaluations WHERE user_id = ? AND record_id = ?").run(userId, recordId)
  if (items.length === 0) return
  const insert = db.prepare(`INSERT INTO tracking_evaluations (id, user_id, record_id, area_id, score, max_score, weight, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const createdAt = new Date().toISOString()
  for (const item of items) {
    if (!Number.isInteger(item.score) || item.score < 1 || item.score > 5) throw new RangeError("Evaluation score must be an integer between 1 and 5.")
    if (!EVALUATION_AREAS.some((area) => area.id === item.areaId)) throw new RangeError("Unknown evaluation area.")
    insert.run(randomUUID(), userId, recordId, item.areaId, item.score, item.maxScore ?? 5, item.weight ?? 1, createdAt)
  }
}
