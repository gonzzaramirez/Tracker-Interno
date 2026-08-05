"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks"
import type { Task } from "@/lib/domain"

type TaskFormProps = {
  /** When provided the form edits this task, otherwise it creates one. */
  task?: Task
  /** Called after a successful submit (used to close inline editors). */
  onClose?: () => void
}

/**
 * Create/edit informational task form — only title and description. Tasks are
 * not assigned to anyone.
 */
export function TaskForm({ task, onClose }: TaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const formKey = task?.id ?? "create"
  const titleId = `task-title-${formKey}`
  const descriptionId = `task-description-${formKey}`

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "")
    const description = String(formData.get("description") ?? "") || undefined

    startTransition(async () => {
      const result = task
        ? await updateTaskAction(task.id, { title, description: description ?? null })
        : await createTaskAction({ title, description })
      if (result.ok) {
        toast.success(task ? "Tarea actualizada" : "Tarea creada")
        if (!task) {
          formRef.current?.reset()
        }
        onClose?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="grid gap-4 rounded-2xl bg-muted/40 p-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor={titleId}>Título</Label>
        <Input
          id={titleId}
          name="title"
          required
          defaultValue={task?.title}
          placeholder="Qué hay que hacer…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={descriptionId}>Descripción</Label>
        <Textarea
          id={descriptionId}
          name="description"
          defaultValue={task?.description ?? ""}
          placeholder="Contexto opcional…"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
          ) : task ? (
            "Guardar cambios"
          ) : (
            "Crear tarea"
          )}
        </Button>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
