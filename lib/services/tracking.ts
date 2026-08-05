/**
 * Tracking use cases — the core of the platform, per tenant.
 */
import { cache } from "react"

import type { Member, TrackingEvaluation, TrackingRecord, TrackingRecordWithTasks } from "@/lib/domain"
import { EVALUATION_AREAS } from "@/lib/domain/tracking"
import { isISODate, todayISO } from "@/lib/domain/date"
import {
  deleteTrackingRecord as deleteTrackingRecordRepo,
  deleteTrackingTask,
  getTrackingById,
  insertTrackingRecord,
  insertTrackingTask,
  listTrackingByMember,
  listTrackingRecords,
  listTrackingTasksByRecords,
  listEvaluationsByRecords,
  replaceTrackingEvaluations,
  updateTrackingRecord as updateTrackingRecordRepo,
  type NewTrackingEvaluation,
  type NewTrackingTask,
} from "@/lib/db/repos/tracking"
import { getMemberById } from "@/lib/db/repos/members"

const ALLOWED_TAGS = new Set([
  "P", "H1", "H2", "H3", "B", "STRONG", "I", "EM", "UL", "OL", "LI",
  "CODE", "PRE", "BR", "HR", "BLOCKQUOTE", "S", "STRIKE",
])

export function normalizeContentHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) throw new Error("El comentario no puede estar vacío.")
  return trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (_, closing, tag, rest) => {
      const upper = tag.toUpperCase()
      if (!ALLOWED_TAGS.has(upper)) return ""
      return `<${closing}${tag}>`
    })
}

export type CreateTrackingInput = {
  memberId: string
  contentHtml: string
  recordDate?: string
  tasks?: NewTrackingTask[]
  evaluations?: NewTrackingEvaluation[]
}

export type UpdateTrackingInput = {
  contentHtml?: string
  recordDate?: string
  tasks?: NewTrackingTask[]
  evaluations?: NewTrackingEvaluation[]
}

function computeRating(evaluations: NewTrackingEvaluation[]): number | null {
  if (evaluations.length === 0) return null
  const totalWeight = evaluations.reduce((sum, e) => sum + (e.weight ?? 1), 0)
  const weighted = evaluations.reduce((sum, e) => sum + (e.score / (e.maxScore ?? 5)) * 5 * (e.weight ?? 1), 0)
  return Math.min(5, Math.max(1, Math.round(weighted / totalWeight)))
}

function assertRecordDate(date: string | undefined): void {
  if (date !== undefined && !isISODate(date)) throw new Error("La fecha debe usar el formato YYYY-MM-DD.")
}

function normalizeEvaluations(evals: NewTrackingEvaluation[] | undefined): NewTrackingEvaluation[] {
  const seen = new Set<string>()
  for (const e of evals ?? []) {
    if (!EVALUATION_AREAS.some((a) => a.id === e.areaId)) throw new Error("Área de evaluación inválida.")
    if (seen.has(e.areaId)) throw new Error("Cada área solo puede evaluarse una vez por registro.")
    seen.add(e.areaId)
    if (!Number.isInteger(e.score) || e.score < 1 || e.score > 5) throw new Error("Puntuación 1-5 requerida.")
  }
  return evals ?? []
}

function sortDesc(a: TrackingRecord, b: TrackingRecord): number {
  if (a.recordDate !== b.recordDate) return b.recordDate.localeCompare(a.recordDate)
  if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt)
  if (a.createdSequence !== b.createdSequence) return b.createdSequence - a.createdSequence
  return b.id.localeCompare(a.id)
}

function sortAsc(a: TrackingRecord, b: TrackingRecord): number { return -sortDesc(a, b) }

async function withDetails(userId: string, records: TrackingRecord[]): Promise<TrackingRecordWithTasks[]> {
  const ids = records.map((r) => r.id)
  const [tasks, evaluations] = await Promise.all([
    listTrackingTasksByRecords(userId, ids),
    listEvaluationsByRecords(userId, ids),
  ])
  return records.map((record) => ({
    record,
    tasks: tasks.filter((t) => t.recordId === record.id),
    evaluations: evaluations.filter((e) => e.recordId === record.id),
  }))
}

// Cache wrappers — one per render cycle (auto-scoped to the request/user)
const memoList = cache((userId: string) => listTrackingRecords(userId))
const memoByMember = cache((userId: string, memberId: string) => listTrackingByMember(userId, memberId))
const memoById = cache((userId: string, id: string) => getTrackingById(userId, id))

export async function getByMember(userId: string, memberId: string): Promise<TrackingRecordWithTasks[]> {
  return withDetails(userId, [...(await memoByMember(userId, memberId))].sort(sortDesc))
}

export async function getByMemberAsc(userId: string, memberId: string): Promise<TrackingRecordWithTasks[]> {
  return withDetails(userId, [...(await memoByMember(userId, memberId))].sort(sortAsc))
}

export async function getLatestByMember(userId: string, memberId: string): Promise<TrackingRecordWithTasks | null> {
  const entries = await memoByMember(userId, memberId)
  if (entries.length === 0) return null
  return withDetails(userId, [...entries].sort(sortDesc).slice(0, 1)).then(([f]) => f ?? null)
}

export type MemberTrackingSummary = {
  member: Member
  records: TrackingRecordWithTasks[]
  latest: TrackingRecordWithTasks | null
  average: number | null
  trend: number | null
  series: number[]
  latestEvaluations: TrackingEvaluation[]
}

function toSummary(member: Member, entries: TrackingRecordWithTasks[]): MemberTrackingSummary {
  const sorted = [...entries].sort((a, b) => sortDesc(a.record, b.record))
  const latest = sorted[0] ?? null
  const previous = sorted[1] ?? null
  const ratings = sorted.map((e) => e.record.rating).filter((r): r is number => r !== null)
  return {
    member,
    records: entries,
    latest,
    average: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null,
    trend: latest && previous && latest.record.rating !== null && previous.record.rating !== null ? latest.record.rating - previous.record.rating : null,
    series: [...ratings].reverse(),
    latestEvaluations: sorted.find((e) => e.evaluations.length > 0)?.evaluations ?? [],
  }
}

export async function getMemberTrackingSummaries(userId: string, members: Member[]): Promise<MemberTrackingSummary[]> {
  const all = await memoList(userId)
  const ids = all.map((r) => r.id)
  const [tasks, evaluations] = await Promise.all([listTrackingTasksByRecords(userId, ids), listEvaluationsByRecords(userId, ids)])
  const byMember = new Map<string, TrackingRecordWithTasks[]>()
  for (const record of all) {
    const list = byMember.get(record.memberId) ?? []
    list.push({ record, tasks: tasks.filter((t) => t.recordId === record.id), evaluations: evaluations.filter((e) => e.recordId === record.id) })
    byMember.set(record.memberId, list)
  }
  return members.map((m) => toSummary(m, byMember.get(m.id) ?? []))
}

export async function getTrackingMetrics(userId: string): Promise<{ recordCount: number; averageRating: number | null }> {
  const all = await memoList(userId)
  const ratings = all.map((r) => r.rating).filter((r): r is number => r !== null)
  return { recordCount: all.length, averageRating: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null }
}

export async function createTrackingRecord(userId: string, input: CreateTrackingInput): Promise<TrackingRecord> {
  if (!input.memberId) throw new Error("Seleccioná un miembro.")
  const member = await getMemberById(userId, input.memberId)
  if (!member) throw new Error("El miembro seleccionado no existe.")
  assertRecordDate(input.recordDate)
  const contentHtml = normalizeContentHtml(input.contentHtml)
  const evaluations = normalizeEvaluations(input.evaluations)

  const record = await insertTrackingRecord(userId, {
    memberId: input.memberId,
    rating: computeRating(evaluations),
    contentHtml,
    recordDate: input.recordDate || todayISO(),
  })
  if (evaluations.length > 0) await replaceTrackingEvaluations(userId, record.id, evaluations)
  for (const task of input.tasks ?? []) {
    if (task.title.trim()) await insertTrackingTask(userId, record.id, task)
  }
  return record
}

export async function updateTrackingRecord(userId: string, id: string, patch: UpdateTrackingInput): Promise<TrackingRecord> {
  if (!id) throw new Error("Se requiere un registro.")
  assertRecordDate(patch.recordDate)
  const contentHtml = patch.contentHtml === undefined ? undefined : normalizeContentHtml(patch.contentHtml)
  const evaluations = patch.evaluations === undefined ? undefined : normalizeEvaluations(patch.evaluations)

  const updated = await updateTrackingRecordRepo(userId, id, {
    rating: evaluations === undefined ? undefined : computeRating(evaluations),
    contentHtml,
    recordDate: patch.recordDate,
  })
  if (!updated) throw new Error("Registro no encontrado.")

  if (evaluations !== undefined) await replaceTrackingEvaluations(userId, updated.id, evaluations)
  if (patch.tasks !== undefined) {
    for (const task of patch.tasks) {
      if (task.title.trim()) await insertTrackingTask(userId, updated.id, task)
    }
  }
  return updated
}

export async function deleteTrackingRecord(userId: string, id: string): Promise<void> {
  const deleted = await deleteTrackingRecordRepo(userId, id)
  if (!deleted) throw new Error("Registro no encontrado.")
}

export async function removeTrackingTask(userId: string, id: string): Promise<void> {
  await deleteTrackingTask(userId, id)
}
