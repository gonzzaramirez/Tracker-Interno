/**
 * FUTURE HTTP contract for the time-off capability (task 1.5).
 *
 * DEFINED but NEVER invoked — documents the swap shape only (REQ-CC-001).
 */

import type { TimeOffEntry, TimeOffType } from "@/lib/domain"

export type CreateTimeOffInput = {
  memberId: string
  startDate: string
  endDate: string
  type: TimeOffType
  note?: string
}

export interface TimeOffApi {
  listByMonth: (month: Date) => Promise<TimeOffEntry[]>
  create: (input: CreateTimeOffInput) => Promise<TimeOffEntry>
}

export const timeOffApi: TimeOffApi = {
  async listByMonth() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async create() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}