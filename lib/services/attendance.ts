/** Attendance use cases per tenant. */
import { cache } from "react"

import type { Attendance, Member } from "@/lib/domain"
import { listAttendanceByDate, listAttendanceByMember, markAttendance, unmarkAttendance } from "@/lib/db/repos/attendance"
import { todayISO, toArgTime } from "@/lib/domain/date"

const memoByDate = cache((userId: string, date: string) => listAttendanceByDate(userId, date))

export type AttendanceLogEntry = { member: Member; attendance: Attendance }

export async function getPresentToday(userId: string, members: Member[]): Promise<Member[]> {
  const records = await memoByDate(userId, todayISO())
  const presentIds = new Set(records.map((r) => r.memberId))
  return members.filter((m) => presentIds.has(m.id))
}

export async function getAttendanceLog(userId: string, memberId: string): Promise<Attendance[]> {
  return listAttendanceByMember(userId, memberId)
}

export async function getAttendanceByDate(userId: string, date: string): Promise<Attendance[]> {
  return memoByDate(userId, date)
}

export async function mark(userId: string, memberId: string): Promise<void> {
  await markAttendance(userId, memberId, todayISO(), toArgTime(new Date()))
}

export async function unmark(userId: string, memberId: string): Promise<void> {
  await unmarkAttendance(userId, memberId, todayISO())
}
