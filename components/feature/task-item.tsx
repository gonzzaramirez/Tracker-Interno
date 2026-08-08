"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CheckIcon, CopyIcon, FileSpreadsheetIcon, Loader2Icon, PencilIcon, TimerIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TaskForm } from "@/components/feature/task-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { deleteTaskAction, toggleTaskDoneAction } from "@/lib/actions/tasks"
import type { Member, Task, TaskSheetMember } from "@/lib/domain"
import { formatArgDateTime, isISODate } from "@/lib/domain/date"

type TaskItemProps = {
  task: Task
  members: Member[]
  /** Member mapping for the sheet (edit prefill). */
  taskSheetMembers?: TaskSheetMember[]
  /** Global average elapsed time in seconds (from "done" stat rows), or null. */
  avgElapsedSeconds?: number | null
}

/**
 * One informational task with inline edit and delete (with confirmation).
 * Tasks can be completed/reopened with one tap — completion stamps the date,
 * which feeds the "objetivos" progress. Tasks with a linked sheet show the
 * import status and link to their counts view.
 */
export function TaskItem({ task, members, taskSheetMembers, avgElapsedSeconds }: TaskItemProps) {
  const [done, setDone] = useState(() => Boolean(task.completedAt))
  const [pendingDone, setPendingDone] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleDone() {
    setPendingDone(true)
    // Optimistic toggle so the UI feels instant; revalidate on server.
    setDone((current) => !current)
    startTransition(async () => {
      const result = await toggleTaskDoneAction(task.id)
      setPendingDone(false)
      if (!result.ok) {
        setDone((current) => !current)
        toast.error(result.error)
      }
    })
  }

  function remove() {
    setConfirmOpen(false)
    startTransition(async () => {
      const result = await deleteTaskAction(task.id)
      if (result.ok) {
        toast.success("Tarea eliminada")
      } else {
        toast.error(result.error)
      }
    })
  }

  async function copyDescription() {
    if (!task.description) {
      return
    }
    try {
      await navigator.clipboard.writeText(task.description)
      toast.success("Descripción copiada")
    } catch {
      toast.error("No se pudo copiar la descripción")
    }
  }

  if (editing) {
    return (
      <div className="py-3">
        <TaskForm task={task} members={members} taskSheetMembers={taskSheetMembers} onClose={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={toggleDone}
          disabled={pendingDone}
          aria-pressed={done}
          aria-label={done ? "Reabrir tarea" : "Completar tarea"}
          title={done ? "Reabrir tarea" : "Completar tarea"}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-1 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50",
            done
              ? "bg-green-500/15 text-green-600 ring-green-500/40 dark:text-green-400"
              : "bg-muted/40 text-transparent ring-foreground/15 hover:ring-foreground/30",
          )}
        >
          {pendingDone ? (
            <Loader2Icon className="size-3 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <CheckIcon className="size-3" aria-hidden />
          )}
        </button>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</p>
          {task.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {done ? "Completada el " : "Creada el "}
            {formatCreatedAt(done && task.completedAt ? task.completedAt : task.createdAt)}
          </p>
          {task.sheetUrl ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Link
                href={`/tasks/${task.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
              >
                <FileSpreadsheetIcon className="size-3.5" aria-hidden />
                Planilla vinculada
                {task.lastSyncedAt
                  ? ` · sincronizada ${new Date(task.lastSyncedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`
                  : " · sin sincronizar"}
              </Link>
              {task.lastSyncError ? (
                <Badge variant="destructive" title={task.lastSyncError} className="cursor-help">
                  Error de sincronización
                </Badge>
              ) : null}
              {avgElapsedSeconds ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground" title="Tiempo promedio global">
                  <TimerIcon className="size-3" aria-hidden />
                  Promedio {formatElapsed(avgElapsedSeconds)}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {task.description ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Copiar descripción"
            title="Copiar descripción"
            onClick={copyDescription}
          >
            <CopyIcon className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Editar tarea"
          onClick={() => setEditing(true)}
        >
          <PencilIcon className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Eliminar tarea"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon className="size-4" aria-hidden />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quita del listado informativo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove} disabled={isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

/** "5 ago 2026" for old date-only tasks; "05/08/2026, 09:15" for new ISO ones. */
function formatCreatedAt(createdAt: string): string {
  if (isISODate(createdAt)) {
    return new Date(`${createdAt}T00:00:00`).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return formatArgDateTime(createdAt)
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}
