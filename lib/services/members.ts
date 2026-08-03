/** Member profile use cases over the SQLite repositories. */

import { cache } from "react"

import type { Feedback, Member, ProgressRecord, Task, TimeOffEntry } from "@/lib/domain"
import type { TimelineEntry } from "@/lib/domain/progress"
import { listFeedbackByMember as listFeedbackByMemberRepo } from "@/lib/db/repos/feedback"
import {
  getMemberById as getMemberByIdRepo,
  listMembers as listMembersRepo,
} from "@/lib/db/repos/members"
import { listProgressByMemberTasks as listProgressByMemberTasksRepo } from "@/lib/db/repos/progress"
import {
  listTasksByMember as listTasksByMemberRepo,
} from "@/lib/db/repos/tasks"
import { listTimeOffByMember as listTimeOffByMemberRepo } from "@/lib/db/repos/timeoff"

export type { TimelineEntry } from "@/lib/domain/progress"

const readMembers = cache(listMembersRepo)
const readMemberById = cache(getMemberByIdRepo)
const readFeedbackByMember = cache(listFeedbackByMemberRepo)
const readTasksByMember = cache(listTasksByMemberRepo)
const readTimeOffByMember = cache(listTimeOffByMemberRepo)
const readProgressByMemberTasks = cache(listProgressByMemberTasksRepo)

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

/** Existing progress read model; check-in timeline UI belongs to package 3. */
export async function getMemberTimeline(memberId: string): Promise<TimelineEntry[]> {
  const tasks = await readTasksByMember(memberId)
  const records = await readProgressByMemberTasks(tasks)
  const titleByTask = new Map(tasks.map((task) => [task.id, task.title]))

  return records
    .map((record) => ({
      id: record.id,
      date: record.date,
      taskId: record.taskId,
      taskTitle: titleByTask.get(record.taskId) ?? "Unknown task",
      value: record.value,
      note: record.note,
    }))
    .sort((a, b) => {
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
