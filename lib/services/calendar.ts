/** Time-off calendar use cases over the SQLite repository. */

import { cache } from "react"

import type { TimeOffEntry, TimeOffType } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"
import {
  insertTimeOff,
  listTimeOff,
  listTimeOffByMember,
} from "@/lib/db/repos/timeoff"

const readTimeOff = cache(listTimeOff)
const readTimeOffByMember = cache(listTimeOffByMember)

export type RequestTimeOffInput = {
  memberId: string
  startDate: string
  endDate: string
  type: TimeOffType
  note?: string
}

export async function getTimeOffEntries(): Promise<TimeOffEntry[]> {
  const entries = await readTimeOff()
  return [...entries].sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return a.startDate.localeCompare(b.startDate)
    }
    return b.endDate.localeCompare(a.endDate)
  })
}

export async function getTimeOffByMember(memberId: string): Promise<TimeOffEntry[]> {
  const entries = await readTimeOffByMember(memberId)
  return [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate))
}

/** Upcoming approved or pending entries; rejected requests stay out of the list. */
export async function getUpcomingTimeOffEntries(): Promise<TimeOffEntry[]> {
  const today = todayISO()
  const entries = await readTimeOff()
  return entries
    .filter((entry) => entry.status !== "rejected" && entry.endDate >= today)
    .sort((a, b) => {
      if (a.startDate !== b.startDate) {
        return a.startDate.localeCompare(b.startDate)
      }
      return b.endDate.localeCompare(a.endDate)
    })
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
