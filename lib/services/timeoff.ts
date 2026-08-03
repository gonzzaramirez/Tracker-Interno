/** Time-off request, approval and calendar reads over SQLite. */

import { cache } from "react"

import type { TimeOffEntry, TimeOffType } from "@/lib/domain"
import { isISODate, todayISO } from "@/lib/domain/date"
import {
  approveTimeOff as approveTimeOffRepo,
  getTimeOffById,
  insertTimeOff,
  listTimeOff,
  listTimeOffByMember,
  rejectTimeOff as rejectTimeOffRepo,
} from "@/lib/db/repos/timeoff"
import { getMemberById } from "@/lib/db/repos/members"

const readTimeOff = cache(listTimeOff)
const readTimeOffByMember = cache(listTimeOffByMember)

export type RequestTimeOffInput = {
  memberId: string
  startDate: string
  endDate: string
  type: TimeOffType
  note?: string
}

function validateDateRange(startDate: string, endDate: string): void {
  if (!isISODate(startDate) || !isISODate(endDate)) {
    throw new Error("Dates must use the YYYY-MM-DD format.")
  }
  if (endDate < startDate) {
    throw new Error("The end date cannot be before the start date.")
  }
}

function sortByStartDate(entries: TimeOffEntry[]): TimeOffEntry[] {
  return [...entries].sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return a.startDate.localeCompare(b.startDate)
    }
    return b.endDate.localeCompare(a.endDate)
  })
}

export async function getTimeOffEntries(): Promise<TimeOffEntry[]> {
  return sortByStartDate(await readTimeOff())
}

export async function getTimeOffByMember(memberId: string): Promise<TimeOffEntry[]> {
  return sortByStartDate(await readTimeOffByMember(memberId))
}

export async function getPendingTimeOff(): Promise<TimeOffEntry[]> {
  return sortByStartDate((await readTimeOff()).filter((entry) => entry.status === "pending"))
}

/** Upcoming approved or pending entries; rejected requests are hidden. */
export async function getUpcomingTimeOffEntries(): Promise<TimeOffEntry[]> {
  const today = todayISO()
  return sortByStartDate(
    (await readTimeOff()).filter(
      (entry) => entry.status !== "rejected" && entry.endDate >= today,
    ),
  )
}

export async function requestTimeOff(input: RequestTimeOffInput): Promise<TimeOffEntry> {
  if (!input.memberId) {
    throw new Error("A member is required.")
  }
  validateDateRange(input.startDate, input.endDate)

  const member = await getMemberById(input.memberId)
  if (!member) {
    throw new Error("The selected member does not exist.")
  }

  return insertTimeOff({
    memberId: input.memberId,
    startDate: input.startDate,
    endDate: input.endDate,
    type: input.type,
    note: input.note?.trim() || undefined,
  })
}

async function transitionPendingTimeOff(
  id: string,
  transition: (entryId: string) => Promise<boolean>,
  nextStatus: "approved" | "rejected",
): Promise<TimeOffEntry> {
  if (!id) {
    throw new Error("A time-off request is required.")
  }

  const changed = await transition(id)
  if (!changed) {
    const current = await getTimeOffById(id)
    if (!current) {
      throw new Error("Time-off request not found.")
    }
    throw new Error(`This request is already ${current.status}; it cannot be ${nextStatus}.`)
  }

  const updated = await getTimeOffById(id)
  if (!updated) {
    throw new Error("Time-off request disappeared after update.")
  }
  return updated
}

export function approveTimeOff(id: string): Promise<TimeOffEntry> {
  return transitionPendingTimeOff(id, approveTimeOffRepo, "approved")
}

export function rejectTimeOff(id: string): Promise<TimeOffEntry> {
  return transitionPendingTimeOff(id, rejectTimeOffRepo, "rejected")
}
