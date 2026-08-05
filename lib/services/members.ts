/** Member use cases per tenant. */
import { cache } from "react"

import type { Member, MemberStatus } from "@/lib/domain"
import { getMemberById as getMemberByIdRepo, insertMember, listMembers, searchMembers, updateMember } from "@/lib/db/repos/members"

const memoList = cache((userId: string) => listMembers(userId))
const memoById = cache((userId: string, id: string) => getMemberByIdRepo(userId, id))

export type CreateMemberInput = { name: string; role: string; status?: MemberStatus; joinedAt: string; displayColor?: string; notes?: string }
export type UpdateMemberInput = { name?: string; role?: string; status?: MemberStatus; joinedAt?: string; displayColor?: string | null; notes?: string | null }

export async function getMembers(userId: string): Promise<Member[]> { return memoList(userId) }
export async function getMember(userId: string, id: string): Promise<Member | undefined> { return memoById(userId, id) }

export async function createMember(userId: string, input: CreateMemberInput): Promise<Member> {
  return insertMember(userId, { ...input, status: input.status ?? "active", role: input.role || "", joinedAt: input.joinedAt || new Date().toISOString().slice(0, 10) })
}

export async function editMember(userId: string, id: string, patch: UpdateMemberInput): Promise<Member | undefined> {
  const current = await getMemberByIdRepo(userId, id)
  if (!current) return undefined
  return updateMember(userId, id, { name: patch.name ?? current.name, role: patch.role ?? current.role, status: patch.status ?? current.status, joinedAt: patch.joinedAt ?? current.joinedAt, displayColor: patch.displayColor === null ? undefined : patch.displayColor ?? current.displayColor, notes: patch.notes === null ? undefined : patch.notes ?? current.notes })
}

export async function searchMembersByQuery(userId: string, query: string): Promise<Member[]> {
  return searchMembers(userId, query)
}
