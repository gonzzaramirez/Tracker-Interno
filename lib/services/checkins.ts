/** Persistent check-in use cases (WD-004, MF-004, MF-005). */

import { cache } from "react"

import type {
  CheckInReminder,
  Member,
  Semaphore,
} from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"
import {
  listDueCheckIns,
  listCheckInsByMember,
  markCheckIn,
  updateCheckInFrequency,
} from "@/lib/db/repos/checkins"
import { getMemberById } from "@/lib/db/repos/members"

const readDueMembers = cache(listDueCheckIns)
const readMemberCheckIns = cache(listCheckInsByMember)

export type CompleteCheckInInput = {
  memberId: string
  note?: string
  semaphore?: Semaphore
}

/** Members whose materialized next check-in is due today or overdue. */
export async function getDueCheckIns(today = todayISO()): Promise<CheckInReminder[]> {
  const members = await readDueMembers(today)
  return Promise.all(
    members.map(async (member) => {
      const records = await readMemberCheckIns(member.id)
      return {
        member,
        dueDate: member.nextCheckinAt,
        state: member.nextCheckinAt < today ? "overdue" : "due",
        lastSemaphore: records[0]?.semaphore ?? null,
      }
    }),
  )
}

/** Complete the current check-in and return the member with its new schedule. */
export async function completeCheckIn(input: CompleteCheckInInput): Promise<Member> {
  if (!input.memberId) {
    throw new Error("A member is required.")
  }

  await markCheckIn({
    memberId: input.memberId,
    date: todayISO(),
    note: input.note?.trim() || undefined,
    semaphore: input.semaphore,
  })

  const member = await getMemberById(input.memberId)
  if (!member) {
    throw new Error("Member not found after completing check-in.")
  }
  return member
}

/** Change cadence and recompute the next due date from the last check-in. */
export async function updateCheckInConfig(memberId: string, freqDays: number): Promise<Member> {
  if (!memberId) {
    throw new Error("A member is required.")
  }
  if (!Number.isInteger(freqDays) || freqDays <= 0) {
    throw new Error("Check-in frequency must be a positive number of days.")
  }

  await updateCheckInFrequency(memberId, freqDays)
  const member = await getMemberById(memberId)
  if (!member) {
    throw new Error("Member not found after updating check-in configuration.")
  }
  return member
}
