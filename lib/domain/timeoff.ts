/**
 * Pure domain types — time-off calendar entries.
 */

export const TIME_OFF_TYPES = ["vacation", "recess", "other"] as const

export type TimeOffType = (typeof TIME_OFF_TYPES)[number]

export type TimeOffEntry = {
  id: string
  memberId: string
  /** ISO date (YYYY-MM-DD), inclusive. */
  startDate: string
  /** ISO date (YYYY-MM-DD), inclusive. */
  endDate: string
  type: TimeOffType
  note?: string
}