import { redirect } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { TaskSheetDetail } from "@/components/feature/task-sheet-detail"
import { requireAuth } from "@/lib/auth-guard"
import { getTask } from "@/lib/services/tasks"
import { getTaskSheetView, getTaskGoals, getTaskGoalView } from "@/lib/services/task-sheets"

export const metadata = {
  title: "Tarea",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Props = {
  params: Promise<{ id: string }>
}

/**
 * Task detail: when the task has a linked Google Sheets planilla, this page
 * shows the imported counts (per member, per day, with the result breakdown),
 * gap analysis, per-row detail via accordion, and embedded goal management.
 */
export default async function TaskDetailPage({ params }: Props) {
  const userId = await requireAuth()
  const { id } = await params

  const task = await getTask(userId, id)
  if (!task) redirect("/tasks")
  if (!task.sheetUrl) redirect("/tasks")

  const [view, allGoals] = await Promise.all([
    getTaskSheetView(userId, id),
    getTaskGoals(userId),
  ])

  const taskGoals = allGoals.filter((g) => g.taskId === id && g.status === "active")
  const taskGoalViews = await Promise.all(
    taskGoals.map((g) => getTaskGoalView(userId, g)),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tarea"
        title="Conteos de la planilla"
        description={`Importados automáticamente desde la hoja vinculada a "${view.task.title}".`}
      />
      <TaskSheetDetail
        task={view.task}
        members={view.members}
        stats={view.stats}
        elapsed={view.elapsed}
        gaps={view.gaps}
        goalViews={taskGoalViews}
      />
    </div>
  )
}
