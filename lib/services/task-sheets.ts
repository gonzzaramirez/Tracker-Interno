/**
 * Task-sheet use cases — la importación de Google Sheets vive dentro de
 * Tareas. Una tarea con sheet_url es una "planilla": el server baja el CSV
 * público, parsea cada fila, traduce el usuario de la planilla (ej:
 * ext_cardedua) al miembro y agrega conteos diarios por resultado.
 *
 * Reglas de conteo (fieles a la planilla del cliente):
 * - Una fila cuenta cuando TASK_STATUS === 'done'.
 * - La fecha es la columna FECHA (ISO, con fallback dd/mm/aaaa y SEARCH_DATE).
 * - FINAL_RESULT se clasifica por coincidencia: hard_match / soft_match /
 *   not_found / other (por ejemplo "Omitted_Hard_Match" cae en hard_match).
 * - Los usuarios sin miembro mapeado se cuentan como "sin mapear" (no se
 *   pierden: aparecen en el resumen del sync).
 * - Los conteos se hacen UPSERT absoluto por (tarea, miembro, fecha,
 *   resultado): el histórico de fechas que dejan de estar en la hoja se
 *   conserva.
 */
import { parse } from "csv-parse/sync"
import { cache } from "react"

import type { SheetResult, TaskDayStat, TaskGoal, TaskSheetMember, Task } from "@/lib/domain"
import { SHEET_RESULTS } from "@/lib/domain/sheet"
import { isISODate, todayISO } from "@/lib/domain/date"
import { goalRangeForType } from "@/lib/domain/goal"
import { getTaskById, listAllTasksWithSheetUrl, setTaskLastSyncedAt, setTaskSyncError } from "@/lib/db/repos/tasks"
import { listMembers } from "@/lib/db/repos/members"
import {
  deleteTaskGoal as deleteTaskGoalRepo,
  getLatestStatDate,
  insertSheetRows,
  insertTaskGoal,
  listStatsAllTime,
  listStatsInRange,
  listTaskGoals,
  listTaskSheetMembers,
  replaceTaskSheetMembers,
  setTaskGoalStatus as setTaskGoalStatusRepo,
  upsertDayStat,
} from "@/lib/db/repos/task-sheets"

// ---------------------------------------------------------------------------
// URL de Google Sheets → CSV export
// ---------------------------------------------------------------------------

const SHEET_URL_PATTERN = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
const GID_PATTERN = /[?#&]gid=(\d+)/

/**
 * Converts any google docs spreadsheet URL (edit/pubhtml/pub) into the
 * public CSV export URL. Returns null when the URL is not a Sheets URL.
 */
export function toCsvExportUrl(url: string): string | null {
  const id = url.match(SHEET_URL_PATTERN)?.[1]
  if (!id) return null
  const gid = url.match(GID_PATTERN)?.[1] ?? "0"
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

export function parseSheetUrl(url: string): { id: string; gid: string } | null {
  const id = url.match(SHEET_URL_PATTERN)?.[1]
  if (!id) return null
  return { id, gid: url.match(GID_PATTERN)?.[1] ?? "0" }
}

/** Validates + normalizes a sheet URL for storage; null when invalid. */
export function normalizeSheetUrl(url: string | undefined | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  return parseSheetUrl(trimmed) ? trimmed : null
}

// ---------------------------------------------------------------------------
// Fetch + parse
// ---------------------------------------------------------------------------

async function fetchSheetCsv(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "Tracker-Interno/1.0" },
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`No se pudo descargar la planilla (HTTP ${response.status}).`)
  }
  return response.text()
}

/** dd/mm/aaaa → aaaa-mm-dd (fallback tolerante para planillas del cliente). */
function normalizeDate(value: string | undefined): string | null {
  const raw = (value ?? "").trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
  return null
}

function classifyResult(value: string | undefined): SheetResult {
  const raw = (value ?? "").trim().toLowerCase()
  if (!raw) return "other"
  if (raw.includes("not_found") || raw.includes("notfound")) return "not_found"
  if (raw.includes("hard")) return "hard_match"
  if (raw.includes("soft")) return "soft_match"
  return "other"
}

/**
 * Parse a timestamp string from the sheet (ISO 8601 or "YYYY-MM-DD HH:MM:SS").
 * Returns elapsed seconds or null when unparseable / non-positive.
 */
function parseElapsed(startStr: string | undefined, endStr: string | undefined): number | null {
  const start = (startStr ?? "").trim()
  const end = (endStr ?? "").trim()
  if (!start || !end) return null
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null
  const seconds = Math.round((endMs - startMs) / 1000)
  return seconds > 0 ? seconds : null
}

export type ElapsedAccum = {
  sumElapsed: number
  minElapsed: number
  maxElapsed: number
  countWithElapsed: number
}

function accumulateElapsed(map: Map<string, ElapsedAccum>, key: string, elapsed: number): void {
  let acc = map.get(key)
  if (!acc) {
    acc = { sumElapsed: 0, minElapsed: elapsed, maxElapsed: elapsed, countWithElapsed: 0 }
    map.set(key, acc)
  }
  acc.sumElapsed += elapsed
  if (elapsed < acc.minElapsed) acc.minElapsed = elapsed
  if (elapsed > acc.maxElapsed) acc.maxElapsed = elapsed
  acc.countWithElapsed += 1
}

function timeStats(acc: ElapsedAccum | undefined) {
  if (!acc || acc.countWithElapsed === 0) return undefined
  return {
    avgElapsedSeconds: Math.round(acc.sumElapsed / acc.countWithElapsed),
    minElapsedSeconds: acc.minElapsed,
    maxElapsedSeconds: acc.maxElapsed,
    rowsWithElapsed: acc.countWithElapsed,
  }
}

export type TaskSyncSummary = {
  taskId: string
  totalRows: number
  countedRows: number
  unmatchedUsers: Record<string, number>
  byResult: Record<SheetResult, number>
  byMember: Record<string, { done: number; hardMatch: number; softMatch: number; notFound: number; other: number }>
  /** Advertencia no fatal (ej. la planilla no tenía filas contables). */
  warning?: string
}

const emptyResultCounts = (): Record<SheetResult, number> => ({
  done: 0,
  hard_match: 0,
  soft_match: 0,
  not_found: 0,
  other: 0,
})

function emptyMemberCounts() {
  return { done: 0, hardMatch: 0, softMatch: 0, notFound: 0, other: 0 }
}

/**
 * Pipeline completo de sync de una tarea con planilla vinculada: descarga →
 * parseo → traducción → agregado → upsert. Lo llaman el cron (todas las
 * tareas), el alta/edición de una tarea con URL de planilla y el botón
 * "Sincronizar ahora". Si falla, el mensaje se persiste en la tarea
 * (`last_sync_error`) para que la UI lo muestre; un sync exitoso lo limpia.
 * Un sync sin filas contadas no es un fallo: se devuelve en `warning`.
 */
export async function syncTaskSheet(userId: string, taskId: string): Promise<TaskSyncSummary> {
  try {
    const task = await getTaskById(userId, taskId)
    if (!task) throw new Error("Tarea no encontrada.")
    if (!task.sheetUrl) throw new Error("La tarea no tiene una hoja vinculada.")
    const exportUrl = toCsvExportUrl(task.sheetUrl)
    if (!exportUrl) throw new Error("La URL no es una planilla de Google Sheets válida.")

    const members = await listTaskSheetMembers(taskId)
    const aliasToMember = new Map(members.map((m) => [m.sheetUser.trim().toLowerCase(), m.memberId]))

    const csv = await fetchSheetCsv(exportUrl)
    const rows = parse(csv, {
      columns: true,
      trim: true,
      skip_empty_lines: true,
      skip_records_with_error: true,
      relax_column_count: true,
      bom: true,
    }) as Array<Record<string, string | undefined>>

    const summary: TaskSyncSummary = {
      taskId,
      totalRows: rows.length,
      countedRows: 0,
      unmatchedUsers: {},
      byResult: emptyResultCounts(),
      byMember: {},
    }

    const counts = new Map<string, number>()
    const elapsedByKey = new Map<string, ElapsedAccum>()
    const keyOf = (memberId: string, date: string, result: SheetResult) => `${memberId}|${date}|${result}`

    // Individual rows to persist (for gap calculation and detail views).
    type SheetRowInput = {
      memberId: string
      date: string
      result: SheetResult
      timestampStart: string | null
      timestampEnd: string | null
      elapsedSeconds: number | null
      sortOrder: number
    }
    const sheetRowsToInsert: SheetRowInput[] = []

    let sortOrder = 0
    for (const row of rows) {
      sortOrder += 1
      const user = (row.USER ?? "").trim()
      if (!user) continue
      const memberId = aliasToMember.get(user.toLowerCase())
      if (!memberId) {
        summary.unmatchedUsers[user] = (summary.unmatchedUsers[user] ?? 0) + 1
        continue
      }
      const status = (row.TASK_STATUS ?? "").trim().toLowerCase()
      if (status !== "done") continue
      const date = normalizeDate(row.FECHA) ?? normalizeDate(row.SEARCH_DATE)
      if (!date || !isISODate(date)) continue

      summary.countedRows += 1
      const result = classifyResult(row.FINAL_RESULT)
      summary.byResult[result] += 1
      let memberCounts = summary.byMember[memberId]
      if (!memberCounts) {
        memberCounts = emptyMemberCounts()
        summary.byMember[memberId] = memberCounts
      }
      if (result === "hard_match") memberCounts.hardMatch += 1
      else if (result === "soft_match") memberCounts.softMatch += 1
      else if (result === "not_found") memberCounts.notFound += 1
      else memberCounts.other += 1
      memberCounts.done += 1

      const key = keyOf(memberId, date, result)
      counts.set(key, (counts.get(key) ?? 0) + 1)

      // Elapsed time from TIMESTAMP_START / TIMESTAMP_END columns.
      const elapsed = parseElapsed(row.TIMESTAMP_START, row.TIMESTAMP_END)
      if (elapsed !== null) {
        accumulateElapsed(elapsedByKey, key, elapsed)
        // Also accumulate on the aggregate "done" key for this (memberId, date).
        accumulateElapsed(elapsedByKey, keyOf(memberId, date, "done"), elapsed)
      }

      // Collect individual row for gap calculation and detail accordion.
      sheetRowsToInsert.push({
        memberId,
        date,
        result,
        timestampStart: (row.TIMESTAMP_START ?? "").trim() || null,
        timestampEnd: (row.TIMESTAMP_END ?? "").trim() || null,
        elapsedSeconds: elapsed,
        sortOrder,
      })
    }

    // Un sync que no cuenta nada es casi siempre un problema de configuración:
    // se avisa en la UI (warning) sin marcar la tarea como fallida.
    if (summary.countedRows === 0) {
      summary.warning =
        summary.totalRows === 0
          ? "La planilla no devolvió filas: comprueba que sea pública y tenga datos."
          : "La planilla no tiene filas contadas: comprueba que los miembros estén mapeados y que las filas tengan TASK_STATUS 'done'."
    }

    // Persist individual rows (for gap calculation and detail accordion).
    await insertSheetRows(taskId, sheetRowsToInsert)

    // Calculate gaps: group rows by (memberId, date), sort by timestamp_start,
    // compute gaps between consecutive rows.
    type GapAccum = {
      totalGapSeconds: number
      maxGapSeconds: number
      gapCount: number
      coverageStart: string
      coverageEnd: string
    }
    const gapByKey = new Map<string, GapAccum>()

    if (sheetRowsToInsert.length > 0) {
      // Group by (memberId, date).
      const rowsByMemberDate = new Map<string, SheetRowInput[]>()
      for (const row of sheetRowsToInsert) {
        const k = `${row.memberId}|${row.date}`
        let arr = rowsByMemberDate.get(k)
        if (!arr) {
          arr = []
          rowsByMemberDate.set(k, arr)
        }
        arr.push(row)
      }

      for (const [k, groupRows] of rowsByMemberDate) {
        // Only rows with valid timestamp_start can be used for gap calculation.
        const timed = groupRows.filter((r) => r.timestampStart && r.timestampEnd)
        if (timed.length < 2) continue

        // Sort by timestamp_start.
        timed.sort((a, b) => (a.timestampStart! < b.timestampStart! ? -1 : a.timestampStart! > b.timestampStart! ? 1 : 0))

        let totalGap = 0
        let maxGap = 0
        let gapCount = 0
        const coverageStart = timed[0].timestampStart!
        let coverageEnd = timed[0].timestampEnd!

        for (let i = 1; i < timed.length; i++) {
          const prev = timed[i - 1]
          const curr = timed[i]
          // Gap = current start - previous end (in seconds).
          const gapMs = new Date(curr.timestampStart!).getTime() - new Date(prev.timestampEnd!).getTime()
          if (Number.isNaN(gapMs) || gapMs <= 0) continue
          const gapSec = Math.round(gapMs / 1000)
          totalGap += gapSec
          if (gapSec > maxGap) maxGap = gapSec
          gapCount += 1
          // Update coverage.
          if (curr.timestampEnd! > coverageEnd) coverageEnd = curr.timestampEnd!
        }

        if (gapCount > 0) {
          gapByKey.set(k, { totalGapSeconds: totalGap, maxGapSeconds: maxGap, gapCount, coverageStart, coverageEnd })
        }
      }
    }

    // Aggregate (memberId, date) totals for the "done" virtual stat.
    const dateTotals = new Map<string, number>()
    for (const [key, count] of counts) {
      const [memberId, date] = key.split("|")
      const dateKey = `${memberId}|${date}`
      dateTotals.set(dateKey, (dateTotals.get(dateKey) ?? 0) + count)
    }

    // Upsert per-result stats with elapsed time.
    //
    // Los conteos son ABSOLUTOS por corrida: cada sync sobreescribe el valor
    // anterior para (tarea, miembro, fecha, resultado) sin comparar. Si el
    // cliente borra filas de la hoja (ej: pepito bajó de 100 a 40 not_found
    // porque se repasan), los conteos simplemente bajan — nunca es un error.
    // El único aviso no fatal es countedRows === 0 (ninguna fila contada).
    for (const [key, count] of counts) {
      const [memberId, date, result] = key.split("|")
      await upsertDayStat(taskId, memberId, date, result as SheetResult, count, timeStats(elapsedByKey.get(key)))
    }

    // Upsert aggregate "done" rows (so UI tabs and goals see real totals).
    for (const [dateKey, total] of dateTotals) {
      const [memberId, date] = dateKey.split("|")
      const doneKey = keyOf(memberId, date, "done")
      const gapKey = `${memberId}|${date}`
      const gap = gapByKey.get(gapKey)
      await upsertDayStat(
        taskId,
        memberId,
        date,
        "done",
        total,
        timeStats(elapsedByKey.get(doneKey)),
        gap
          ? { totalGapSeconds: gap.totalGapSeconds, maxGapSeconds: gap.maxGapSeconds, gapCount: gap.gapCount, coverageStart: gap.coverageStart, coverageEnd: gap.coverageEnd }
          : undefined,
      )
    }
    await setTaskLastSyncedAt(userId, taskId, new Date().toISOString())

    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    try {
      await setTaskSyncError(userId, taskId, message)
    } catch {
      // Persistir el fallo no debe tapar el error original.
    }
    throw error
  }
}

/** Cron path: sync de todas las tareas con planilla, recolectando resultados. */
export async function syncAllTaskSheets(): Promise<Array<{ taskId: string; ok: boolean; error?: string }>> {
  const tasks = await listAllTasksWithSheetUrl()
  const results: Array<{ taskId: string; ok: boolean; error?: string }> = []
  for (const task of tasks) {
    try {
      await syncTaskSheet(task.userId, task.id)
      results.push({ taskId: task.id, ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      try {
        // syncTaskSheet ya persiste el error; esto cubre el caso raro en el
        // que esa escritura falla.
        await setTaskSyncError(task.userId, task.id, message)
      } catch {
        // Una tarea fallida no debe frenar a las demás.
      }
      results.push({ taskId: task.id, ok: false, error: message })
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// CRUD de tareas con hoja (validate + persist members + first sync)
// ---------------------------------------------------------------------------

export type TaskSheetInput = {
  sheetUrl?: string | null
  sheetMembers: Array<{ memberId: string; sheetUser: string }>
}

export function assertTaskSheetInput(input: TaskSheetInput): void {
  if (input.sheetUrl && !parseSheetUrl(input.sheetUrl)) {
    throw new Error("La URL no es una planilla de Google Sheets válida (docs.google.com/spreadsheets/d/...).")
  }
  if (input.sheetUrl && input.sheetMembers.length === 0) {
    throw new Error("Una tarea con hoja necesita al menos un miembro con su usuario en la planilla.")
  }
  for (const member of input.sheetMembers) {
    if (!member.sheetUser.trim()) throw new Error("Cada miembro necesita su usuario en la planilla.")
  }
}

// ---------------------------------------------------------------------------
// Vista de tarea con hoja
// ---------------------------------------------------------------------------

export type DayElapsed = {
  avgElapsedSeconds: number
  minElapsedSeconds: number
  maxElapsedSeconds: number
  rowsWithElapsed: number
}

export type TaskSheetView = {
  task: Task
  members: Array<TaskSheetMember & { memberName: string }>
  /** Conteos por miembro y fecha (todas las fechas, sin filtrar). */
  stats: Map<string, Map<string, Partial<Record<SheetResult, number>>>>
  /** Elapsed-time per (memberId, date) — only "done" rows with data. */
  elapsed: Map<string, Map<string, DayElapsed>>
  /** Gap stats per (memberId, date) — only "done" rows with gap data. */
  gaps: Map<string, Map<string, TaskDayStat>>
}

function statsToMatrix(stats: TaskDayStat[]): TaskSheetView["stats"] {
  const byMember = new Map<string, Map<string, Partial<Record<SheetResult, number>>>>()
  for (const stat of stats) {
    let byDate = byMember.get(stat.memberId)
    if (!byDate) {
      byDate = new Map()
      byMember.set(stat.memberId, byDate)
    }
    let day = byDate.get(stat.date)
    if (!day) {
      day = {}
      byDate.set(stat.date, day)
    }
    day[stat.result] = stat.count
  }
  return byMember
}

export async function getTaskSheetView(userId: string, taskId: string): Promise<TaskSheetView> {
  const task = await getTaskById(userId, taskId)
  if (!task) throw new Error("Tarea no encontrada.")
  if (!task.sheetUrl) throw new Error("La tarea no tiene hoja vinculada.")
  const links = await listTaskSheetMembers(taskId)
  const members = await listMembers(userId)
  const byId = new Map(members.map((member) => [member.id, member]))
  const stats = await listStatsAllTime(taskId, links.map((link) => link.memberId))

  // Build elapsed map: only "done" rows with time data.
  const elapsed = new Map<string, Map<string, DayElapsed>>()
  // Build gaps map: only "done" rows with gapCount > 0.
  const gaps = new Map<string, Map<string, TaskDayStat>>()
  for (const stat of stats) {
    if (stat.result === "done" && stat.rowsWithElapsed && stat.rowsWithElapsed > 0 && stat.avgElapsedSeconds != null) {
      let byDate = elapsed.get(stat.memberId)
      if (!byDate) {
        byDate = new Map()
        elapsed.set(stat.memberId, byDate)
      }
      byDate.set(stat.date, {
        avgElapsedSeconds: stat.avgElapsedSeconds,
        minElapsedSeconds: stat.minElapsedSeconds ?? stat.avgElapsedSeconds,
        maxElapsedSeconds: stat.maxElapsedSeconds ?? stat.avgElapsedSeconds,
        rowsWithElapsed: stat.rowsWithElapsed,
      })
    }
    if (stat.result === "done" && stat.gapCount && stat.gapCount > 0) {
      let byDate = gaps.get(stat.memberId)
      if (!byDate) {
        byDate = new Map()
        gaps.set(stat.memberId, byDate)
      }
      byDate.set(stat.date, stat)
    }
  }

  return {
    task,
    members: links.map((link) => ({
      ...link,
      memberName: byId.get(link.memberId)?.name ?? "Miembro eliminado",
    })),
    stats: statsToMatrix(stats),
    elapsed,
    gaps,
  }
}

/**
 * Miembros mapeados a la planilla de una tarea, con su nombre legible.
 * Lo usa el form de creación de objetivos para los checkboxes de usuarios.
 */
export async function getTaskSheetMembers(
  userId: string,
  taskId: string,
): Promise<Array<TaskSheetMember & { memberName: string }>> {
  const [links, members] = await Promise.all([listTaskSheetMembers(taskId), listMembers(userId)])
  const nameById = new Map(members.map((member) => [member.id, member.name]))
  return links.map((link) => ({
    ...link,
    memberName: nameById.get(link.memberId) ?? "Miembro eliminado",
  }))
}

// ---------------------------------------------------------------------------
// Task goals (objetivos de hoja, por usuario)
// ---------------------------------------------------------------------------

export type CreateTaskGoalInput = {
  taskId: string
  name: string
  target: number
  type: TaskGoal["type"]
  memberIds?: string[]
}

export async function createTaskGoal(userId: string, input: CreateTaskGoalInput): Promise<TaskGoal> {
  const target = Number(input.target)
  if (!Number.isFinite(target) || target <= 0) throw new Error("La meta debe ser un número mayor a cero.")
  if (!input.name.trim()) throw new Error("El nombre del objetivo es obligatorio.")
  const task = await getTaskById(userId, input.taskId)
  if (!task || !task.sheetUrl) throw new Error("La tarea seleccionada no tiene hoja vinculada.")
  return insertTaskGoal(userId, {
    taskId: input.taskId,
    name: input.name.trim(),
    target,
    type: input.type,
    memberIds: input.memberIds,
  })
}

export async function archiveTaskGoal(userId: string, id: string): Promise<TaskGoal> {
  const goal = await setTaskGoalStatusRepo(userId, id, "archived")
  if (!goal) throw new Error("Objetivo no encontrado.")
  return goal
}

export async function deleteTaskGoal(userId: string, id: string): Promise<void> {
  if (!(await deleteTaskGoalRepo(userId, id))) throw new Error("Objetivo no encontrado.")
}

export type TaskGoalMemberRow = {
  memberId: string
  memberName: string
  done: number
  hardMatch: number
  softMatch: number
  notFound: number
  other: number
  target: number
  progressPct: number
  /** done − target: positivo = superado, negativo = falta. */
  delta: number
}

export type TaskGoalView = {
  goal: TaskGoal
  taskName: string
  period: { startDate: string; endDate: string }
  rows: TaskGoalMemberRow[]
}

/**
 * Progreso de un objetivo de hoja: por cada miembro mapeado a la tarea,
 * suma de conteos 'done' (+ desglose) dentro del período que define el tipo
 * del objetivo, anclado a la última fecha con datos (o a hoy si no hay).
 * El target es POR USUARIO.
 */
export async function getTaskGoalView(userId: string, goal: TaskGoal): Promise<TaskGoalView> {
  const task = await getTaskById(userId, goal.taskId)
  const links = await listTaskSheetMembers(goal.taskId)
  const members = await listMembers(userId)
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  // Filter members: if goal.memberIds is non-empty, only consider those members.
  const filteredLinks =
    goal.memberIds.length > 0
      ? links.filter((link) => goal.memberIds.includes(link.memberId))
      : links

  const memberIds = filteredLinks.map((link) => link.memberId)
  const latestStat = await getLatestStatDate(goal.taskId, memberIds)
  const anchor = latestStat ?? todayISO()
  const period = goalRangeForType(goal.type, anchor)
  const stats = await listStatsInRange(
    goal.taskId,
    memberIds,
    period.startDate,
    period.endDate,
  )

  const totals = new Map<string, Partial<Record<SheetResult, number>>>()
  for (const stat of stats) {
    let memberTotals = totals.get(stat.memberId)
    if (!memberTotals) {
      memberTotals = {}
      totals.set(stat.memberId, memberTotals)
    }
    memberTotals[stat.result] = (memberTotals[stat.result] ?? 0) + stat.count
  }

  const rows: TaskGoalMemberRow[] = filteredLinks.map((link) => {
    const memberTotals = totals.get(link.memberId) ?? {}
    const done = memberTotals.done ?? 0
    return {
      memberId: link.memberId,
      memberName: memberNameById.get(link.memberId) ?? "Miembro eliminado",
      done,
      hardMatch: memberTotals.hard_match ?? 0,
      softMatch: memberTotals.soft_match ?? 0,
      notFound: memberTotals.not_found ?? 0,
      other: memberTotals.other ?? 0,
      target: goal.target,
      progressPct: goal.target > 0 ? Math.round((done / goal.target) * 100) : 0,
      delta: done - goal.target,
    }
  })

  return {
    goal,
    taskName: task?.title ?? "Tarea",
    period: rows.length > 0 ? period : period,
    rows: rows.sort((a, b) => b.done - a.done),
  }
}

const memoGoals = cache((userId: string) => listTaskGoals(userId))

export async function getTaskGoals(userId: string): Promise<TaskGoal[]> {
  return memoGoals(userId)
}

export async function getTaskGoalViews(userId: string): Promise<TaskGoalView[]> {
  const goals = await getTaskGoals(userId)
  return Promise.all(goals.map((goal) => getTaskGoalView(userId, goal)))
}

/** Fills all result buckets so the UI can always render 5 columns. */
export function resultCountsFor(day: Partial<Record<SheetResult, number>> | undefined): Record<SheetResult, number> {
  const filled: Record<SheetResult, number> = { done: 0, hard_match: 0, soft_match: 0, not_found: 0, other: 0 }
  if (!day) return filled
  for (const result of SHEET_RESULTS) {
    filled[result] = day[result] ?? 0
  }
  return filled
}

// Kept for the tasks service: validate + persist sheet members on save.
export { replaceTaskSheetMembers }
