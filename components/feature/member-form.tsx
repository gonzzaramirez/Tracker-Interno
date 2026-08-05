"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon, PlusIcon } from "lucide-react"
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
import { createMemberAction, updateMemberAction } from "@/lib/actions/members"
import type { Member, MemberStatus } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string }> = [
  { value: "active", label: "Activo" },
  { value: "recess", label: "En receso" },
]

const COLOR_OPTIONS = [
  { value: "#0ea5e9", label: "Celeste" },
  { value: "#22c55e", label: "Verde" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#64748b", label: "Gris" },
]

type MemberFormProps = {
  mode: "create" | "edit"
  member?: Member
  onDone?: () => void
}

/**
 * Member create/edit form (member CRUD). Create mode shows a collapsed card
 * with an "Agregar miembro" toggle; edit mode renders the fields directly.
 */
export function MemberForm({ mode, member, onDone }: MemberFormProps) {
  const [open, setOpen] = useState(mode === "edit")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      role: String(formData.get("role") ?? ""),
      status: (String(formData.get("status") ?? "active") as MemberStatus),
      joinedAt: String(formData.get("joinedAt") ?? todayISO()),
      displayColor: String(formData.get("displayColor") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMemberAction(input)
          : await updateMemberAction(member?.id ?? "", input)
      if (result.ok) {
        toast.success(mode === "create" ? "Miembro agregado" : "Miembro actualizado")
        formRef.current?.reset()
        if (mode === "create") {
          setOpen(false)
        }
        onDone?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!open) {
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          <PlusIcon className="size-4" aria-hidden />
          Agregar miembro
        </Button>
      </div>
    )
  }

  const nameId = `member-name-${mode}`
  const roleId = `member-role-${mode}`
  const statusId = `member-status-${mode}`
  const joinedId = `member-joined-${mode}`
  const colorId = `member-color-${mode}`
  const notesId = `member-notes-${mode}`

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId}>Nombre</Label>
        <Input
          id={nameId}
          name="name"
          required
          defaultValue={member?.name}
          placeholder="Nombre y apellido…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={roleId}>Rol / Área</Label>
        <Input
          id={roleId}
          name="role"
          required
          defaultValue={member?.role}
          placeholder="ej. Frontend, Diseño, QA…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={statusId}>Estado</Label>
          <Select name="status" defaultValue={member?.status ?? "active"} items={STATUS_OPTIONS}>
            <SelectTrigger id={statusId} aria-label="Estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={joinedId}>Fecha de ingreso</Label>
          <Input
            id={joinedId}
            name="joinedAt"
            type="date"
            required
            defaultValue={member?.joinedAt ?? todayISO()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={colorId}>Color</Label>
        <Select name="displayColor" defaultValue={member?.displayColor ?? COLOR_OPTIONS[0].value} items={COLOR_OPTIONS}>
          <SelectTrigger id={colorId} aria-label="Color" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: option.value }}
                    aria-hidden
                  />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={notesId}>Notas</Label>
        <Textarea
          id={notesId}
          name="notes"
          rows={3}
          defaultValue={member?.notes}
          placeholder="Notas internas sobre la persona (opcional)…"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          {mode === "create" ? "Agregar miembro" : "Guardar cambios"}
        </Button>
        {mode === "create" ? (
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
