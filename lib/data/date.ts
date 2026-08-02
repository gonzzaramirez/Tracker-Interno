/**
 * Date helpers shared by the mock layer — local-time ISO strings (D3).
 */

/** Format a Date as ISO YYYY-MM-DD in local time. */
export function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Today as ISO YYYY-MM-DD. */
export function todayISO(): string {
  return isoDate(new Date())
}

/** ISO date N days from today (negative = past). */
export function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

/** All ISO dates inside an inclusive [start, end] range. */
export function eachDateInRange(start: string, end: string): string[] {
  const [startYear, startMonth, startDay] = start.split("-").map(Number)
  const [endYear, endMonth, endDay] = end.split("-").map(Number)
  const cursor = new Date(startYear, startMonth - 1, startDay)
  const last = new Date(endYear, endMonth - 1, endDay)
  const dates: string[] = []
  while (cursor <= last) {
    dates.push(isoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}