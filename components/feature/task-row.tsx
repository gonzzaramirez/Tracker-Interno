"use client"

import { useState, useTransition } from "react"
import { CalendarDaysIcon, Loader2Icon, PencilIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PriorityBadge, TaskStatusBadge } from "@/components/feature/status-badge"
import { ProgressControl } from "@/components/feature/progress-control"
import { TaskForm } from "@/components/feature/task-form"
import type { Member, TaskStatus, TaskWithProgress } from "@/lib/domain"
import { TASK_STATUSES } from "@/lib/domain"
import { transitionTaskAction } from "@/lib/actions/tasks"

type TaskRowProps = {
  taskWithProgress: TaskWithProgress
  members: Member[]
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: "En cola",
  "in-progress": "En progreso",
  done: "Hecho",
}

function todaysISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function dueLabel(dueDate: string | undefined): string | null {
  if (!dueDate) {
    return null
  }
  const due = new Date(`${dueDate}T00:00:00`)
  const label = due.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
  if (dueDate === todaysISO()) {
    return `Vence hoy, ${label}`
  }
  return `Vence ${label}`
}

/**
 * Single task: identity, status transitions (REQ-TT-004), inline editing
 * (REQ-TT-002) and the progress slider (REQ-TT-003).
 */
export function TaskRow({ taskWithProgress, members }: TaskRowProps) {
  const { task, currentValue } = taskWithProgress
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  function changeStatus(nextStatus: TaskStatus) {
    startTransition(async () => {
      const result = await transitionTaskAction(task.id, nextStatus)
      if (!result.ok) {
        toast.error(result.error)
      }
    })
  }

  const label = dueLabel(task.dueDate)

  return (
    <div className="rounded-2xl px-1 py-4 sm:px-2 first:pt-0 last:pb-0">
      {editing ? (
        <TaskForm members={members} task={task} onClose={() => setEditing(false)} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              {task.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
              ) : null}
              {label ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDaysIcon className="size-3.5" />
                  {label}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Select value={task.status} onValueChange={(value) => changeStatus(value ?? "queued")}>
                <SelectTrigger
                  size="sm"
                  className="w-fit"
                  disabled={isPending}
                  aria-label={`Estado de ${task.title}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isPending}
                aria-label={`Editar ${task.title}`}
                onClick={() => setEditing(true)}
              >
                {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : <PencilIcon aria-hidden />}
              </Button>
            </div>
          </div>

          {task.status !== "done" ? (
            <ProgressControl taskId={task.id} taskTitle={task.title} initialValue={currentValue} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Progreso final: {currentValue}% — tarea completada.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
