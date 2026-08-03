/**
 * Weekly dashboard use cases over the SQLite repositories.
 *
 * Pages import this layer only. Repository reads are wrapped with React.cache
 * so repeated reads during one server render share a result without adding
 * mutable request state to the database singleton.
 */

import { endOfWeek, startOfWeek } from "date-fns"
import { cache } from "react"

import type { Member, Task, TimeOffEntry } from "@/lib/domain"
import type { SeriesPoint, WeekHighlight } from "@/lib/domain/dashboard"
import { addDays, todayISO } from "@/lib/domain/date"
import { listFeedback as listFeedbackRepo } from "@/lib/db/repos/feedback"
import { listMembers as listMembersRepo } from "@/lib/db/repos/members"
import { listProgress as listProgressRepo } from "@/lib/db/repos/progress"
import { listTasks as listTasksRepo } from "@/lib/db/repos/tasks"
import { listTimeOff as listTimeOffRepo } from "@/lib/db/repos/timeoff"

export type { SeriesPoint, WeekHighlight, WeekHighlightKind } from "@/lib/domain/dashboard"

const readMembers = cache(listMembersRepo)
const readTasks = cache(listTasksRepo)
const readProgress = cache(listProgressRepo)
const readFeedback = cache(listFeedbackRepo)
const readTimeOff = cache(listTimeOffRepo)

export type MemberWeekView = {
  member: Member
  highlights: WeekHighlight[]
}

export type WeeklyOverview = {
  members: MemberWeekView[]
}

export type WeeklyMetrics = {
  memberCount: number
  openTasks: number
  completedTasks: number
  feedbackAvg: number | null
  feedbackCount: number
  /** Approved time-off entries overlapping the current week. */
  timeOffCount: number
  series: SeriesPoint[]
}

const WEEK_START = { weekStartsOn: 1 } as const

function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** [startISO, endISO] for the current week (Monday-Sunday). */
function currentWeekRange(): [string, string] {
  return [isoDate(startOfWeek(new Date(), WEEK_START)), isoDate(endOfWeek(new Date(), WEEK_START))]
}

function overlapsWeek(entry: TimeOffEntry, startISO: string, endISO: string): boolean {
  return entry.startDate <= endISO && entry.endDate >= startISO
}

function approvedEntries(entries: TimeOffEntry[]): TimeOffEntry[] {
  return entries.filter((entry) => entry.status === "approved")
}

function buildHighlights(
  member: Member,
  tasks: Task[],
  timeOff: TimeOffEntry[],
  weekRange: [string, string],
): WeekHighlight[] {
  const today = todayISO()
  const highlights: WeekHighlight[] = []

  for (const task of tasks) {
    if (task.memberId !== member.id || !task.dueDate || task.status === "done") {
      continue
    }
    if (task.dueDate === today) {
      highlights.push({ kind: "due-today", label: task.title, date: task.dueDate })
    } else if (task.dueDate < today) {
      highlights.push({ kind: "overdue", label: task.title, date: task.dueDate })
    }
  }

  for (const entry of timeOff) {
    if (entry.memberId === member.id && overlapsWeek(entry, weekRange[0], weekRange[1])) {
      highlights.push({ kind: "time-off", label: entry.note ?? entry.type, date: entry.startDate })
    }
  }

  return highlights
}

/** Weekly member list + per-member approved time-off/task highlights. */
export async function getWeeklyOverview(): Promise<WeeklyOverview> {
  const [members, tasks, allTimeOff] = await Promise.all([
    readMembers(),
    readTasks(),
    readTimeOff(),
  ])
  const timeOff = approvedEntries(allTimeOff)
  const weekRange = currentWeekRange()

  return {
    members: members.map((member) => ({
      member,
      highlights: buildHighlights(member, tasks, timeOff, weekRange),
    })),
  }
}

/** Weekly metrics + 7-day mini-graph series. */
export async function getWeeklyMetrics(): Promise<WeeklyMetrics> {
  const [members, tasks, feedback, allTimeOff, progress] = await Promise.all([
    readMembers(),
    readTasks(),
    readFeedback(),
    readTimeOff(),
    readProgress(),
  ])
  const timeOff = approvedEntries(allTimeOff)
  const [weekStart, weekEnd] = currentWeekRange()

  const openTasks = tasks.filter((task) => task.status !== "done").length
  const completedTasks = tasks.filter((task) => task.status === "done").length
  const timeOffCount = timeOff.filter((entry) => overlapsWeek(entry, weekStart, weekEnd)).length
  const feedbackAvg =
    feedback.length === 0
      ? null
      : feedback.reduce((sum, entry) => sum + entry.rating, 0) / feedback.length

  const today = todayISO()
  const series: SeriesPoint[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset)
    series.push({
      date,
      recorded: progress.filter((record) => record.date === date).length,
      feedback: feedback.filter((entry) => entry.date === date).length,
    })
  }

  return {
    memberCount: members.length,
    openTasks,
    completedTasks,
    feedbackAvg,
    feedbackCount: feedback.length,
    timeOffCount,
    series,
  }
}
