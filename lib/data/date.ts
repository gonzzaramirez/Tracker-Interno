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