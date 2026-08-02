/**
 * Time-off calendar use cases (task 7.1).
 */

import type { TimeOffEntry, TimeOffType } from "@/lib/domain"
import { insertTimeOff, listTimeOff, listTimeOffByMember } from "@/lib/data/timeoff"
import { eachDateInRange, todayISO } from "@/lib/data/date"

export type RequestTimeOffInput = {
  memberId: string
  startDate: string
  endDate: string
  type: TimeOffType
  note?: string
}

/** All time-off entries, soonest first (REQ-TO-002). */
export async function getTimeOffEntries(): Promise<TimeOffEntry[]> {
  const entries = await listTimeOff()
  return entries.sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return a.startDate.localeCompare(b.startDate)
    }
    return b.endDate.localeCompare(a.endDate)
  })
}

export async function getTimeOffByMember(memberId: string): Promise<TimeOffEntry[]> {
  const entries = await listTimeOffByMember(memberId)
  return entries.sort((a, b) => b.startDate.localeCompare(a.startDate))
}

/** Time-off entries that start today or later, soonest first (REQ-TO-002). */
export async function getUpcomingTimeOffEntries(): Promise<TimeOffEntry[]> {
  const entries = await listTimeOff()
  const today = todayISO()
  return entries
    .filter((entry) => entry.endDate >= today)
    .sort((a, b) => {
      if (a.startDate !== b.startDate) {
        return a.startDate.localeCompare(b.startDate)
      }
      return b.endDate.localeCompare(a.endDate)
    })
}

/**
 * Indexes entries by covered date — `{ "2026-08-03": [entry, ...] }`.
 * Pure, serializable, feeds the calendar view (REQ-TO-001).
 */
export function indexTimeOffByDate(entries: TimeOffEntry[]): Record<string, TimeOffEntry[]> {
  const index: Record<string, TimeOffEntry[]> = {}
  for (const entry of entries) {
    for (const date of eachDateInRange(entry.startDate, entry.endDate)) {
      ;(index[date] ??= []).push(entry)
    }
  }
  return index
}

export async function requestTimeOff(input: RequestTimeOffInput): Promise<TimeOffEntry> {
  if (!input.startDate || !input.endDate) {
    throw new Error("Both a start and an end date are required.")
  }
  if (input.endDate < input.startDate) {
    throw new Error("The end date cannot be before the start date.")
  }
  return insertTimeOff({
    memberId: input.memberId,
    startDate: input.startDate,
    endDate: input.endDate,
    type: input.type,
    note: input.note?.trim() || undefined,
  })
}