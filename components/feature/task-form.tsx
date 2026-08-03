"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks"
import type { Member, Task, TaskPriority } from "@/lib/domain"

type TaskFormProps = {
  members: Member[]
  /** When provided the form edits this task, otherwise it creates one. */
  task?: Task
  /** Called after a successful submit (used to close inline editors). */
  onClose?: () => void
}

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
]

/**
 * Create/edit task form (REQ-TT-002) bound to a Server Action; mutations are
 * persisted and echoed after revalidation.
 */
export function TaskForm({ members, task, onClose }: TaskFormProps) {
  const [memberId, setMemberId] = useState(task?.memberId ?? members[0]?.id ?? "")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const formKey = task?.id ?? "create"
  const titleId = `task-title-${formKey}`
  const descriptionId = `task-description-${formKey}`
  const memberIdForLabel = `task-member-${formKey}`
  const priorityId = `task-priority-${formKey}`
  const dueDateId = `task-duedate-${formKey}`

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createTaskAction({
        memberId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        priority,
        dueDate: String(formData.get("dueDate") ?? "") || undefined,
      })
      if (result.ok) {
        toast.success("Tarea creada")
        formRef.current?.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  function submitUpdate(formData: FormData) {
    if (!task) {
      return
    }
    startTransition(async () => {
      const result = await updateTaskAction(task.id, {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        priority,
        dueDate: String(formData.get("dueDate") ?? "") || null,
      })
      if (result.ok) {
        toast.success("Tarea actualizada")
        onClose?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={task ? submitUpdate : submitCreate}
      className="grid gap-4 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={titleId}>Título</Label>
        <Input
          id={titleId}
          name="title"
          required
          defaultValue={task?.title}
          placeholder="Qué hay que hacer…"
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={descriptionId}>Descripción</Label>
        <Textarea
          id={descriptionId}
          name="description"
          defaultValue={task?.description ?? ""}
          placeholder="Contexto opcional para la tarea…"
          rows={2}
        />
      </div>

      {!task ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={memberIdForLabel}>Miembro</Label>
          <Select value={memberId} onValueChange={(value) => setMemberId(value ?? "")}>
            <SelectTrigger id={memberIdForLabel} aria-label="Miembro" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={priorityId}>Prioridad</Label>
        <Select
          value={priority}
          onValueChange={(value) => setPriority((value ?? "medium") as TaskPriority)}
        >
          <SelectTrigger id={priorityId} aria-label="Prioridad" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={dueDateId}>Fecha de vencimiento</Label>
        <Input
          id={dueDateId}
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
        />
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending || !memberId}>
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
