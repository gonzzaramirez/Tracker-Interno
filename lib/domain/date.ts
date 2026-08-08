/**
 * Pure date helpers for ISO date-only values. This module is safe to import
 * from browser components because it has no framework, filesystem or database
 * dependencies.
 */

export type DateRange = {
  startDate: string
  endDate: string
}

/**
 * App-wide timezone: everything (capture and display) is pinned to Argentina.
 * The server (Turso/Vercel) runs in UTC, so local getters are never used for
 * wall-clock time or calendar dates.
 */
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires"

const argDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const argTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const argHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  hour12: false,
  hourCycle: "h23",
})

const argWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  weekday: "short",
})

/**
 * Horario laboral argentino: la hoja de Google solo se actualiza de lunes a
 * viernes entre las 09:00 y las 18:00 (America/Argentina/Buenos_Aires). El
 * cron de sync no debe pegarle a la hoja fuera de esa ventana.
 */
export const WORK_HOURS = { startHour: 9, endHour: 18 } as const

/**
 * Días de fin de semana considerados laborables (0 = lunes … 6 = domingo).
 * Si el equipo trabaja los sábados, agregá 5 acá y isWorkTime lo respeta.
 */
export const WORK_WEEKEND_DAYS: ReadonlyArray<number> = []

/** Format a Date as an ISO YYYY-MM-DD value in local time. */
export function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Today as an ISO YYYY-MM-DD value in Argentina time. */
export function todayISO(): string {
  return argDateFormatter.format(new Date())
}

/** Wall-clock time (HH:MM, 24h) in Argentina time. */
export function toArgTime(date: Date): string {
  return argTimeFormatter.format(date)
}

/** Current hour (0-23) in Argentina time. */
export function toArgHour(date: Date): number {
  return Number(argHourFormatter.format(date))
}

/** Current weekday in Argentina time: 0 = Monday … 6 = Sunday. */
export function toArgWeekday(date: Date): number {
  const label = argWeekdayFormatter.format(date)
  const WEEKDAY_LABELS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  return WEEKDAY_LABELS[label] ?? 0
}

/**
 * Whether `date` falls inside the Argentine work schedule: Monday–Friday
 * (plus any WORK_WEEKEND_DAYS) with the local hour in [startHour, endHour)
 * — 09:00 inclusive, 18:00 exclusive.
 */
export function isWorkTime(date: Date): boolean {
  const weekday = toArgWeekday(date)
  if (weekday >= 5 && !WORK_WEEKEND_DAYS.includes(weekday)) {
    return false
  }
  const hour = toArgHour(date)
  return hour >= WORK_HOURS.startHour && hour < WORK_HOURS.endHour
}

/** Format an ISO timestamp as a short "DD/MM, HH:MM" in Argentina time. */
export function formatArgDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return `${argDateFormatter.format(date)}, ${toArgTime(date)}`
}

/** Whether a value is a real calendar date in YYYY-MM-DD form. */
export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
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
