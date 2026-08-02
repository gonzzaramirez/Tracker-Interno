/**
 * Weekly dashboard use cases (task 2.1).
 *
 * Aggregates members, tasks, feedback and time-off repos into the shapes the
 * RSC pages render. This is the ONLY layer pages import — swap-safe (CC-001).
 */

import { endOfWeek, startOfWeek } from "date-fns"

import type { Member, Task, TimeOffEntry } from "@/lib/domain"
import { listFeedback } from "@/lib/data/feedback"
import { listMembers } from "@/lib/data/members"
import { listProgress } from "@/lib/data/progress"
import { listTasks } from "@/lib/data/tasks"
import { listTimeOff } from "@/lib/data/timeoff"

export type WeekHighlightKind = "due-today" | "overdue" | "time-off"

export type WeekHighlight = {
  kind: WeekHighlightKind
  label: string
  /** ISO date for the highlight (due date / time-off start). */
  date?: string
}

export type MemberWeekView = {
  member: Member
  highlights: WeekHighlight[]
}

export type WeeklyOverview = {
  members: MemberWeekView[]
}

export type SeriesPoint = {
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Progress records registered that day. */
  recorded: number
  /** Feedback entries created that day. */
  feedback: number
}

export type WeeklyMetrics = {
  memberCount: number
  openTasks: number
  completedTasks: number
  feedbackAvg: number | null
  feedbackCount: number
  /** Time-off entries overlapping the current week. */
  timeOffCount: number
  series: SeriesPoint[]
}

const WEEK_START = { weekStartsOn: 1 } as const

function toISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function todayISO(): string {
  return toISO(new Date())
}

/** [startISO, endISO] for the current week (Monday-Sunday). */
function currentWeekRange(): [string, string] {
  const start = startOfWeek(new Date(), WEEK_START)
  const end = endOfWeek(new Date(), WEEK_START)
  return [toISO(start), toISO(end)]
}

function overlapsWeek(entry: TimeOffEntry, startISO: string, endISO: string): boolean {
  return entry.startDate <= endISO && entry.endDate >= startISO
}

function buildHighlights(
  member: Member,
  tasks: Task[],
  timeOff: TimeOffEntry[],
  weekRange: [string, string]
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
    if (entry.memberId !== member.id) {
      continue
    }
    if (overlapsWeek(entry, weekRange[0], weekRange[1])) {
      highlights.push({ kind: "time-off", label: entry.note ?? entry.type, date: entry.startDate })
    }
  }

  return highlights
}

/** Weekly member list + per-member highlights (REQ-WD-001). */
export async function getWeeklyOverview(): Promise<WeeklyOverview> {
  const [members, tasks, timeOff] = await Promise.all([
    listMembers(),
    listTasks(),
    listTimeOff(),
  ])
  const weekRange = currentWeekRange()

  return {
    members: members.map((member) => ({
      member,
      highlights: buildHighlights(member, tasks, timeOff, weekRange),
    })),
  }
}

/** Weekly metrics + 7-day mini-graph series (REQ-WD-002). */
export async function getWeeklyMetrics(): Promise<WeeklyMetrics> {
  const [members, tasks, feedback, timeOff] = await Promise.all([
    listMembers(),
    listTasks(),
    listFeedback(),
    listTimeOff(),
  ])
  const progress = await listProgress()
  const [weekStart, weekEnd] = currentWeekRange()

  const openTasks = tasks.filter((task) => task.status !== "done").length
  const completedTasks = tasks.filter((task) => task.status === "done").length
  const timeOffCount = timeOff.filter((entry) => overlapsWeek(entry, weekStart, weekEnd)).length

  const feedbackAvg =
    feedback.length === 0
      ? null
      : feedback.reduce((sum, entry) => sum + entry.rating, 0) / feedback.length

  const series: SeriesPoint[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    const key = toISO(date)
    series.push({
      date: key,
      recorded: progress.filter((record) => record.date === key).length,
      feedback: feedback.filter((entry) => entry.date === key).length,
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