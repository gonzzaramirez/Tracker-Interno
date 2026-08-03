import { CheckSquareIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { TaskForm } from "@/components/feature/task-form"
import { TaskList, type MemberTaskGroup } from "@/components/feature/task-list"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AppleCard } from "@/components/feature/card"
import { getMembers } from "@/lib/services/members"
import { getTasksWithProgress } from "@/lib/services/tasks"

export const metadata = {
  title: "Tareas",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TasksPage() {
  const [members, tasks] = await Promise.all([getMembers(), getTasksWithProgress()])

  const active = tasks.filter((entry) => entry.task.status !== "done")
  const done = tasks.filter((entry) => entry.task.status === "done")

  const groups: MemberTaskGroup[] = members.map((member) => ({
    member,
    active: active.filter((entry) => entry.task.memberId === member.id),
    done: done.filter((entry) => entry.task.memberId === member.id),
  }))

  const hasAnyTask = tasks.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seguimiento"
        title="Tareas"
        description="Asigná tareas, seguí el progreso 0–100 y mantené el pile de completadas visible."
      />

      <AppleCard>
        <TaskForm members={members} />
      </AppleCard>

      {!hasAnyTask ? (
        <AppleCard>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckSquareIcon />
              </EmptyMedia>
              <EmptyTitle>Sin tareas aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Creá la primera tarea arriba y aparecerá acá, agrupada por miembro.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </AppleCard>
      ) : (
        <TaskList groups={groups} members={members} />
      )}
    </div>
  )
}
