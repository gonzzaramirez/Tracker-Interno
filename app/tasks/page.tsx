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
import { getAllTasks } from "@/lib/services/tasks"

export const metadata = {
  title: "Tareas",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TasksPage() {
  const userId = await requireAuth()
  const tasks = await getAllTasks(userId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Referencia"
        title="Tareas"
        description="Listado informativo de tareas — sin asignaciones, para tenerlas a mano al registrar seguimientos."
      />

      <AppleCard>
        <AppleCardTitle>Nueva tarea</AppleCardTitle>
        <TaskForm />
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
                Creá la primera tarea arriba y aparecerá acá.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
