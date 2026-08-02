/**
 * Member profile use cases (task 3.1).
 */

import type {
  Feedback,
  Member,
  ProgressRecord,
  Task,
  TimeOffEntry,
} from "@/lib/domain"
import { listFeedbackByMember } from "@/lib/data/feedback"
import { getMemberById, listMembers } from "@/lib/data/members"
import { listProgressByMemberTasks } from "@/lib/data/progress"
import { listTasksByMember } from "@/lib/data/tasks"
import { listTimeOffByMember } from "@/lib/data/timeoff"

export type TimelineEntry = {
  id: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  taskId: string
  taskTitle: string
  /** Progress value 0-100. */
  value: number
  note?: string
}

export type MemberFeed = {
  member: Member
  tasks: Task[]
  progress: ProgressRecord[]
  feedback: Feedback[]
  timeOff: TimeOffEntry[]
}

export async function getMembers(): Promise<Member[]> {
  return listMembers()
}

export async function getMember(id: string): Promise<Member | undefined> {
  return getMemberById(id)
}

/** Follow-up records by date with their task title, chronological (REQ-MF-003). */
export async function getMemberTimeline(memberId: string): Promise<TimelineEntry[]> {
  const tasks = await listTasksByMember(memberId)
  const records = await listProgressByMemberTasks(tasks)
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
  const member = await getMemberById(memberId)
  if (!member) {
    return undefined
  }

  const [tasks, feedback, timeOff] = await Promise.all([
    listTasksByMember(memberId),
    listFeedbackByMember(memberId),
    listTimeOffByMember(memberId),
  ])
  const progress = await listProgressByMemberTasks(tasks)

  return { member, tasks, progress, feedback, timeOff }
}