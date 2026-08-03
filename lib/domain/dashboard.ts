/** Pure read-model types shared by dashboard services and client charts. */

export type WeekHighlightKind = "due-today" | "overdue" | "time-off"

export type WeekHighlight = {
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
