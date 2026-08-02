/**
 * FUTURE HTTP contract for the members capability (task 1.5).
 *
 * DEFINED but NEVER invoked — documents the swap shape only (REQ-CC-001).
 */

import type { Feedback, Member, ProgressRecord, Task, TimeOffEntry } from "@/lib/domain"

export type MemberFeed = {
  member: Member
  tasks: Task[]
  progress: ProgressRecord[]
  feedback: Feedback[]
  timeOff: TimeOffEntry[]
}

export interface MembersApi {
  getMembers: () => Promise<Member[]>
  getMember: (id: string) => Promise<Member | undefined>
  getMemberFeed: (id: string) => Promise<MemberFeed | undefined>
  getMemberTimeline: (
    id: string
  ) => Promise<Array<{ id: string; date: string; taskTitle: string; value: number; note?: string }>>
}

export const membersApi: MembersApi = {
  async getMembers() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getMember() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getMemberFeed() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async getMemberTimeline() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}