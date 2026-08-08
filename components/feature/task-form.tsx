"use client"

import { useRef, useState, useTransition } from "react"
import { FileSpreadsheetIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
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
import type { Member, Task, TaskSheetMember } from "@/lib/domain"

type MemberRow = {
  memberId: string
  sheetUser: string
}

type TaskFormProps = {
  members: Member[]
  /** When provided the form edits this task, otherwise it creates one. */
  task?: Task
  /** Member ↔ sheet-user mapping currently stored on the task (edit mode). */
  taskSheetMembers?: TaskSheetMember[]
  /** Called after a successful submit (used to close inline editors). */
  onClose?: () => void
}

/**
 * Create/edit task. When a Google Sheets URL is pasted, the task becomes a
 * "planilla": the server imports the sheet automatically and the form maps
 * each member to their username in the sheet (e.g. Eduardo Cardoso →
 * ext_cardedua) — the mapping is typed by hand, the counting is automatic.
 */
export function TaskForm({ members, task, taskSheetMembers, onClose }: TaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(task?.title ?? "")
  const [sheetUrl, setSheetUrl] = useState(task?.sheetUrl ?? "")
  const [rows, setRows] = useState<MemberRow[]>(() => {
    if (taskSheetMembers && taskSheetMembers.length > 0) {
      return taskSheetMembers.map((link) => ({ memberId: link.memberId, sheetUser: link.sheetUser }))
    }
    return [{ memberId: members[0]?.id ?? "", sheetUser: "" }]
  })
  const formRef = useRef<HTMLFormElement>(null)
  const formKey = task?.id ?? "create"
  const titleId = `task-title-${formKey}`
  const descriptionId = `task-description-${formKey}`

  function updateRow(index: number, patch: Partial<MemberRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "")
    const description = String(formData.get("description") ?? "") || undefined
    const url = sheetUrl.trim() || null
    const sheetMembers = rows.filter((row) => row.memberId && row.sheetUser.trim())

    startTransition(async () => {
      const result = task
        ? await updateTaskAction(task.id, {
            title,
            description: description ?? null,
            sheetUrl: url,
            sheetMembers,
          })
        : await createTaskAction({ title, description, sheetUrl: url, sheetMembers })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const { sync } = result.data
      if (sync) {
        if (sync.warning) {
          toast.warning(
            `Tarea ${task ? "actualizada" : "creada"}, pero ${sync.warning.charAt(0).toLowerCase()}${sync.warning.slice(1)}`,
          )
        } else {
          toast.success(
            `Planilla importada: ${sync.countedRows} tareas done de ${sync.totalRows} filas.`,
          )
        }
        const unmatched = Object.keys(sync.unmatchedUsers)
        if (unmatched.length > 0) {
          toast.warning(
            `${unmatched.length} usuario(s) sin mapear: ${unmatched.slice(0, 5).join(", ")}${unmatched.length > 5 ? "…" : ""}`,
          )
        }
      } else {
        toast.success(task ? "Tarea actualizada" : "Tarea creada")
      }
      if (!task) {
        formRef.current?.reset()
        setSheetUrl("")
        setRows([{ memberId: members[0]?.id ?? "", sheetUser: "" }])
      }
      onClose?.()
    })
  }

  const hasSheet = Boolean(sheetUrl.trim())
  const valid = Boolean(title.trim()) && (!hasSheet || rows.some((row) => row.memberId && row.sheetUser.trim()))

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
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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

      <div className="space-y-2 border-t border-foreground/5 pt-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheetIcon className="size-4 text-muted-foreground" aria-hidden />
          <Label htmlFor={`task-sheet-${formKey}`} className="text-sm font-semibold">
            Planilla de Google Sheets (opcional)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Pegá la URL pública de la hoja y el sistema importa los conteos automáticamente
          (filas con estado <span className="font-medium text-foreground">done</span>, con
          desglose por resultado).
        </p>
        <Input
          id={`task-sheet-${formKey}`}
          value={sheetUrl}
          onChange={(event) => setSheetUrl(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          inputMode="url"
        />
      </div>

      {hasSheet ? (
        <div className="space-y-2 border-t border-foreground/5 pt-3">
          <Label className="text-sm font-semibold">Miembros que trabajan en la planilla</Label>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={row.memberId}
                  onValueChange={(value) => updateRow(index, { memberId: value ?? "" })}
                  items={members.map((member) => ({ value: member.id, label: member.name }))}
                >
                  <SelectTrigger className="w-48" aria-label={`Miembro ${index + 1}`}>
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
                <Input
                  value={row.sheetUser}
                  onChange={(event) => updateRow(index, { sheetUser: event.target.value })}
                  placeholder="Usuario en la planilla (ej: ext_cardedua)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar miembro"
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, { memberId: members[0]?.id ?? "", sheetUser: "" }])}
          >
            <PlusIcon className="size-4" aria-hidden />
            Agregar miembro
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending || !valid}>
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
