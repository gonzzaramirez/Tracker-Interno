/** Member profile use cases over the SQLite repositories. */

import { cache } from "react"

import type { CheckIn, Feedback, Member, ProgressRecord, Task, TimeOffEntry } from "@/lib/domain"
import { listCheckInsByMember } from "@/lib/db/repos/checkins"
import { listFeedbackByMember as listFeedbackByMemberRepo } from "@/lib/db/repos/feedback"
import {
  getMemberById as getMemberByIdRepo,
  listMembers as listMembersRepo,
} from "@/lib/db/repos/members"
import { listProgressByMemberTasks as listProgressByMemberTasksRepo } from "@/lib/db/repos/progress"
import { listTasksByMember as listTasksByMemberRepo } from "@/lib/db/repos/tasks"
import { listTimeOffByMember as listTimeOffByMemberRepo } from "@/lib/db/repos/timeoff"

export type TimelineEntry = CheckIn

const readMembers = cache(listMembersRepo)
const readMemberById = cache(getMemberByIdRepo)
const readFeedbackByMember = cache(listFeedbackByMemberRepo)
const readTasksByMember = cache(listTasksByMemberRepo)
const readTimeOffByMember = cache(listTimeOffByMemberRepo)
const readProgressByMemberTasks = cache(listProgressByMemberTasksRepo)
const readCheckInsByMember = cache(listCheckInsByMember)

export type MemberFeed = {
  member: Member
  tasks: Task[]
  progress: ProgressRecord[]
  feedback: Feedback[]
  timeOff: TimeOffEntry[]
}

export async function getMembers(): Promise<Member[]> {
  return readMembers()
}

export async function getMember(id: string): Promise<Member | undefined> {
  return readMemberById(id)
}

/** Completed check-ins ordered chronologically for the member profile. */
export async function getMemberTimeline(memberId: string): Promise<TimelineEntry[]> {
  const records = await readCheckInsByMember(memberId)
  return [...records].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.id.localeCompare(b.id)
  })
}

/** Full member profile data (REQ-MF-002). */
export async function getMemberFeed(memberId: string): Promise<MemberFeed | undefined> {
  const member = await readMemberById(memberId)
  if (!member) {
    return undefined
  }

  const [tasks, feedback, timeOff] = await Promise.all([
    readTasksByMember(memberId),
    readFeedbackByMember(memberId),
    readTimeOffByMember(memberId),
  ])
  const progress = await readProgressByMemberTasks(tasks)

  return { member, tasks, progress, feedback, timeOff }
}
