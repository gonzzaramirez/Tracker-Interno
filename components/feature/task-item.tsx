"use client"

import { useState, useTransition } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { deleteTaskAction } from "@/lib/actions/tasks"
import type { Task } from "@/lib/domain"

type TaskItemProps = {
  task: Task
}

/**
 * One informational task with inline edit and delete (with confirmation).
 */
export function TaskItem({ task }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  if (editing) {
    return (
      <div className="py-3">
        <TaskForm task={task} onClose={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Creada el{" "}
          {new Date(`${task.createdAt}T00:00:00`).toLocaleDateString("es-AR", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
