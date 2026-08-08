/**
 * Pure domain types — hojas de Google Sheets vinculadas a tareas.
 *
 * Una tarea puede tener una hoja pública: el server baja el CSV
 * periódicamente, traduce los usuarios a miembros (task_sheet_members) y
 * agrega conteos diarios por resultado (task_daily_stats). Los objetivos de
 * hoja miden tareas 'done' por miembro dentro de un período.
 */

import { SHEET_GOAL_TYPES, SHEET_RESULTS, type SheetGoalType, type SheetResult } from "@/lib/db/schema"

export type { SheetGoalType, SheetResult }
export { SHEET_GOAL_TYPES, SHEET_RESULTS }

export const SHEET_RESULT_LABELS: Record<SheetResult, string> = {
  done: "Hechas",
  hard_match: "Hard match",
  soft_match: "Soft match",
  not_found: "Not found",
  other: "Otros",
}

export const SHEET_GOAL_TYPES_LABELS: Record<SheetGoalType, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
}

/** Vínculo miembro ↔ usuario en la planilla (ej: miembro Eduardo → ext_cardedua). */
export type TaskSheetMember = {
  taskId: string
  memberId: string
  sheetUser: string
}

export type TaskDayStat = {
  taskId: string
  memberId: string
  /** ISO date (YYYY-MM-DD) — la columna FECHA de la planilla. */
  date: string
  result: SheetResult
  count: number
  /** Elapsed-time metrics (seconds). Only present when rows_with_elapsed > 0. */
  avgElapsedSeconds?: number
  minElapsedSeconds?: number
  maxElapsedSeconds?: number
  rowsWithElapsed?: number
  /** Gap (free time) metrics. Only present on result="done" rows with gap_count > 0. */
  totalGapSeconds?: number
  maxGapSeconds?: number
  gapCount?: number
  coverageStart?: string
  coverageEnd?: string
}

/** Individual CSV row imported from a sheet task — preserves import order. */
export type TaskSheetRow = {
  id: number
  taskId: string
  memberId: string
  date: string
  result: SheetResult
  timestampStart: string | null
  timestampEnd: string | null
  elapsedSeconds: number | null
  sortOrder: number
}

export type TaskGoal = {
  id: string
  userId: string
  taskId: string
  name: string
  /** Meta diaria/semanal/mensual POR USUARIO. */
  target: number
  type: SheetGoalType
  status: "active" | "archived"
  /** Members this goal applies to. Empty array = all mapped members. */
  memberIds: string[]
  createdAt: string
}
