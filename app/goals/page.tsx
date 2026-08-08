import { PageHeader } from "@/components/layout/page-header"
import { TaskGoalSection } from "@/components/feature/task-goal-section"
import { requireAuth } from "@/lib/auth-guard"
import { getAllTasks } from "@/lib/services/tasks"
import { getTaskGoalViews } from "@/lib/services/task-sheets"

export const metadata = {
  title: "Objetivos",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GoalsPage() {
  const userId = await requireAuth()

  const tasks = await getAllTasks(userId)
  const sheetTasks = tasks.filter((task) => task.sheetUrl)
  const taskGoalViews = await getTaskGoalViews(userId)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestión"
        title="Objetivos"
        description="Objetivos por tarea con planilla — el progreso se actualiza solo con cada sync."
      />

      <TaskGoalSection tasks={sheetTasks} views={taskGoalViews} />
    </div>
  )
}
