/**
 * FUTURE HTTP contract for the weekly dashboard (task 1.5).
 *
 * DEFINED but NEVER invoked — this file only documents the swap shape.
 * When the backend exists, services rebind from `lib/data` to this api
 * and no component changes (REQ-CC-001).
 */

import type { Member, Task, ProgressRecord, Feedback, TimeOffEntry } from "@/lib/domain"

export type WeeklyMetrics = {
  memberCount: number
  openTasks: number
  completedTasks: number
  feedbackAvg: number | null
  feedbackCount: number
  timeOffCount: number
  series: Array<{ date: string; recorded: number; feedback: number }>
}

export type WeekHighlight = {
  kind: "due-today" | "overdue" | "time-off"
  label: string
}

export interface DashboardApi {
  getWeeklyMetrics: () => Promise<WeeklyMetrics>
  getMemberWeekOverview: (memberId: string) => Promise<{
    member: Member
    highlights: WeekHighlight[]
  }>
  getMembers: () => Promise<Member[]>
  getTasks: () => Promise<Task[]>
  getProgress: () => Promise<ProgressRecord[]>
  getFeedback: () => Promise<Feedback[]>
  getTimeOff: () => Promise<TimeOffEntry[]>
}

export const dashboardApi: DashboardApi = {
  async getWeeklyMetrics() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getMemberWeekOverview() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getMembers() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getTasks() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getProgress() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getFeedback() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getTimeOff() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}