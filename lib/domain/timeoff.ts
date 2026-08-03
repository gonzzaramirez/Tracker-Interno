/**
 * Pure domain types — time-off calendar entries.
 */

export const TIME_OFF_TYPES = ["vacation", "license", "sickness", "holiday"] as const

export type TimeOffType = (typeof TIME_OFF_TYPES)[number]

export const TIME_OFF_STATUSES = ["pending", "approved", "rejected"] as const

export type TimeOffStatus = (typeof TIME_OFF_STATUSES)[number]

export type TimeOffEntry = {
  id: string
  memberId: string
  /** ISO date (YYYY-MM-DD), inclusive. */
  startDate: string
  /** ISO date (YYYY-MM-DD), inclusive. */
  endDate: string
  type: TimeOffType
  status: TimeOffStatus
  note?: string
  /** ISO date (YYYY-MM-DD) when the entry was created. */
  createdAt: string
}
