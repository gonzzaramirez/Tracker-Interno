/**
 * Pure date helpers for ISO date-only values. This module is safe to import
 * from browser components because it has no framework, filesystem or database
 * dependencies.
 */

export type DateRange = {
  startDate: string
  endDate: string
}

/** Format a Date as an ISO YYYY-MM-DD value in local time. */
export function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Today as an ISO YYYY-MM-DD value. */
export function todayISO(): string {
  return isoDate(new Date())
}

/** Add calendar days to an ISO date without introducing a timezone offset. */
export function addDays(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + Math.trunc(days))
  return isoDate(date)
}

/** ISO date N days from today (negative = past). */
export function daysFromNow(days: number): string {
  return addDays(todayISO(), days)
}

/** All ISO dates inside an inclusive [start, end] range. */
export function eachDateInRange(start: string, end: string): string[] {
  if (start > end) {
    return []
  }

  const dates: string[] = []
  let cursor = start
  while (cursor <= end) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return dates
}

/** Index any date-range records by every date they cover, inclusively. */
export function indexTimeOffByDate<T extends DateRange>(entries: T[]): Record<string, T[]> {
  const index: Record<string, T[]> = {}
  for (const entry of entries) {
    for (const date of eachDateInRange(entry.startDate, entry.endDate)) {
      ;(index[date] ??= []).push(entry)
    }
  }
  return index
}
