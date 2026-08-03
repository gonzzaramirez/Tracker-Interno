/** Pure domain types for scheduled check-ins and follow-up records. */

import type { Member } from "./member"

export const SEMAPHORES = ["green", "yellow", "red"] as const

export type Semaphore = (typeof SEMAPHORES)[number]

export type CheckIn = {
  id: string
  memberId: string
  /** ISO date (YYYY-MM-DD) when the check-in was completed. */
  date: string
  semaphore: Semaphore | null
  note?: string
  /** ISO date (YYYY-MM-DD) when the record was created. */
  createdAt: string
}

export type CheckInReminderState = "due" | "overdue"

export type CheckInReminder = {
  member: Member
  dueDate: string
  state: CheckInReminderState
  lastSemaphore: Semaphore | null
}
