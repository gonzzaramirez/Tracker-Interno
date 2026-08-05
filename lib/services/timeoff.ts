/** Time-off use cases per tenant. */
import { cache } from "react"

import type { TimeOff, TimeOffType } from "@/lib/domain"
import {
  deleteTimeOff as deleteTimeOffRepo,
  insertTimeOff,
  listTimeOffByMember,
  updateTimeOffStatus,
} from "@/lib/db/repos/timeoff"
import { listMembers } from "@/lib/db/repos/members"

const memoByMember = cache((userId: string, memberId: string) => listTimeOffByMember(userId, memberId))

export type CreateTimeOffInput = { memberId: string; startDate: string; endDate: string; type: TimeOffType; note?: string }

export async function getTimeOffByMember(userId: string, memberId: string): Promise<TimeOff[]> { return memoByMember(userId, memberId) }

/** All time-off entries for the tenant, newest first. */
export async function listAllTimeOff(userId: string): Promise<TimeOff[]> {
  const members = await listMembers(userId)
  const results: TimeOff[] = []
  for (const m of members) {
    results.push(...(await memoByMember(userId, m.id)))
  }
  return results.sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export async function createTimeOff(userId: string, input: CreateTimeOffInput): Promise<TimeOff> {
  return insertTimeOff(userId, { memberId: input.memberId, startDate: input.startDate, endDate: input.endDate, type: input.type, note: input.note })
}

export async function approveTimeOff(userId: string, id: string): Promise<TimeOff> {
  const updated = await updateTimeOffStatus(userId, id, "approved")
  if (!updated) throw new Error("Solicitud no encontrada.")
  return updated
}

export async function rejectTimeOff(userId: string, id: string): Promise<TimeOff> {
  const updated = await updateTimeOffStatus(userId, id, "rejected")
  if (!updated) throw new Error("Solicitud no encontrada.")
  return updated
}

export async function deleteTimeOff(userId: string, id: string): Promise<void> {
  if (!(await deleteTimeOffRepo(userId, id))) throw new Error("Solicitud no encontrada.")
}
