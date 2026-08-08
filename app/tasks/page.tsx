import { CheckSquareIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { TaskForm } from "@/components/feature/task-form"
import { TaskItem } from "@/components/feature/task-item"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { requireAuth } from "@/lib/auth-guard"
import { getMembers } from "@/lib/services/members"
import { getAllTasks } from "@/lib/services/tasks"
import { getTaskElapsedSummary, listTaskSheetMembers } from "@/lib/db/repos/task-sheets"

export const metadata = {
  title: "Tareas",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TasksPage() {
  const userId = await requireAuth()
  const [tasks, members] = await Promise.all([getAllTasks(userId), getMembers(userId)])

  const sheetLinks = new Map<string, Awaited<ReturnType<typeof listTaskSheetMembers>>>()
  const elapsedSummaries = new Map<string, number | null>()
  for (const task of tasks) {
    if (task.sheetUrl) {
      const links = await listTaskSheetMembers(task.id)
      sheetLinks.set(task.id, links)
      const memberIds = links.map((l) => l.memberId)
      const summary = await getTaskElapsedSummary(task.id, memberIds)
      elapsedSummaries.set(task.id, summary.avgElapsedSeconds)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Tareas"
        description="Tareas con planilla de Google Sheets vinculada: pegá la URL, mapeá tus miembros y los conteos se importan solos."
      />

      <AppleCard>
        <AppleCardTitle>Nueva tarea</AppleCardTitle>
        <TaskForm members={members} />
      </AppleCard>

      <AppleCard>
        <AppleCardTitle>Todas las tareas</AppleCardTitle>
        {tasks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckSquareIcon />
              </EmptyMedia>
              <EmptyTitle>Sin tareas aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Creá la primera tarea arriba — si le pegás una planilla, el sistema importa los conteos automáticamente.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} members={members} taskSheetMembers={sheetLinks.get(task.id)} avgElapsedSeconds={elapsedSummaries.get(task.id)} />
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
