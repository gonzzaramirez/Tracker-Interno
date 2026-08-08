/**
 * Pure domain helpers — period ranges for sheet goals (objetivos de planilla).
 *
 * A sheet goal measures completed tasks inside a period (daily, weekly or
 * monthly), anchored at a date. Custom ranges are passed through as-is.
 */

import type { SheetGoalType } from "@/lib/domain/sheet"
import { addDays, isoDate } from "@/lib/domain/date"

/** Monday-start week for the given ISO date (locale es-AR convention). */
function startOfWeek(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const dayIndex = (date.getDay() + 6) % 7 // 0 = Monday
  date.setDate(date.getDate() - dayIndex)
  return isoDate(date)
}

/**
 * Compute the inclusive period for a goal type anchored at `anchorDate`
 * (YYYY-MM-DD). Custom ranges are passed through as-is.
 */
export function goalRangeForType(
  type: SheetGoalType | "custom",
  anchorDate: string,
  custom?: { start: string; end: string },
): { startDate: string; endDate: string } {
  if (type === "custom") {
    return { startDate: custom?.start ?? anchorDate, endDate: custom?.end ?? anchorDate }
  }
  if (type === "daily") {
    return { startDate: anchorDate, endDate: anchorDate }
  }
  if (type === "weekly") {
    const start = startOfWeek(anchorDate)
    return { startDate: start, endDate: addDays(start, 6) }
  }
  // monthly
  const [year, month] = anchorDate.split("-").map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return { startDate: `${year}-${String(month).padStart(2, "0")}-01`, endDate: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` }
}
