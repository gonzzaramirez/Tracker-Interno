import { notFound } from "next/navigation"

import { PmDrilldown } from "@/components/feature/pm-drilldown"
import { requirePm } from "@/lib/auth-guard"
import { getUserById } from "@/lib/db/repos/users"
import { getMembers } from "@/lib/services/members"
import { getMemberTrackingSummaries, getTrackingMetrics } from "@/lib/services/tracking"
import { listAllTimeOff } from "@/lib/services/timeoff"
import { getAttendanceByDate } from "@/lib/services/attendance"
import { getBoards } from "@/lib/services/boards"
import { getAllTasks } from "@/lib/services/tasks"
import { getTaskGoalViews } from "@/lib/services/task-sheets"
import type { TaskGoalView } from "@/lib/services/task-sheets"
import { todayISO } from "@/lib/domain/date"

export const metadata = {
  title: "Supervisor",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Props = {
  params: Promise<{ userId: string }>
}

/**
 * PM drill-down: read-only overview of everything a supervisor tracks about
 * their team. Every service below is called with the TARGET supervisor id —
 * this is a cross-tenant read, guarded by requirePm().
 */
export default async function PmSupervisorPage({ params }: Props) {
  await requirePm()
  const { userId } = await params

  const supervisor = await getUserById(userId)
  if (!supervisor || supervisor.role !== "supervisor") notFound()

  const members = await getMembers(userId)
  const [summaries, metrics, timeOff, attendanceToday, boards, allTasks, goalViews] = await Promise.all([
    getMemberTrackingSummaries(userId, members),
    getTrackingMetrics(userId),
    listAllTimeOff(userId),
    getAttendanceByDate(userId, todayISO()),
    getBoards(userId),
    getAllTasks(userId),
    getTaskGoalViews(userId),
  ])

  // Tareas con planilla + sus objetivos agrupados por tarea (payload liviano:
  // task + goalViews, sin getTaskSheetView que es pesado).
  const viewsByTaskId = new Map<string, TaskGoalView[]>()
  for (const view of goalViews) {
    const list = viewsByTaskId.get(view.goal.taskId)
    if (list) list.push(view)
    else viewsByTaskId.set(view.goal.taskId, [view])
  }
  const taskGoals = allTasks
    .filter((task) => task.sheetUrl)
    .map((task) => ({ task, views: viewsByTaskId.get(task.id) ?? [] }))
    .sort((a, b) => a.task.title.localeCompare(b.task.title, "es"))

  return (
    <PmDrilldown
      supervisor={supervisor}
      summaries={summaries}
      metrics={metrics}
      timeOff={timeOff}
      presentMemberIds={attendanceToday.map((entry) => entry.memberId)}
      boards={boards}
      taskGoals={taskGoals}
    />
  )
}
