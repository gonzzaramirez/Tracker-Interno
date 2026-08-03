/** Pure read-model types shared by dashboard services and client charts. */

export type WeekHighlightKind = "due-today" | "overdue" | "time-off"

export type WeekHighlight = {
  /** Stable source entity id used by list renderers. */
  id: string
  kind: WeekHighlightKind
  label: string
  /** ISO date for the highlight (due date / time-off start). */
  date?: string
}

export type SeriesPoint = {
  /** ISO date (YYYY-MM-DD). */
  date: string
  recorded: number
  feedback: number
}

export type WeeklyOccupancyPoint = {
  /** ISO date (YYYY-MM-DD), Monday through Sunday. */
  date: string
  /** Short localized weekday label for the chart axis. */
  label: string
  /** Number of distinct members with approved time off on this date. */
  count: number
}
