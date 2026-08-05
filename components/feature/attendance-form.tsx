"use client"

import { useState, useTransition } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { markAttendanceAction, unmarkAttendanceAction } from "@/lib/actions/attendance"
import type { Attendance, Member } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

function currentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

type AttendanceFormProps = {
  members: Member[]
  /** When set, the form edits this existing mark instead of creating one. */
  attendance?: Attendance
  onDone?: () => void
}

/**
 * Create/edit an attendance mark: member, date and the wall-clock time it was
 * made. The date defaults to today and the time to the current moment.
 */
export function AttendanceForm({ members, attendance, onDone }: AttendanceFormProps) {
  const editing = Boolean(attendance)
  const [memberId, setMemberId] = useState(attendance?.memberId ?? "")
  const [date, setDate] = useState(attendance?.date ?? todayISO())
  const [markedAt, setMarkedAt] = useState(attendance?.markedAt ?? currentTime())
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    const nextMemberId = String(formData.get("memberId") ?? "")
    if (!nextMemberId) {
      toast.error("Seleccioná un miembro.")
      return
    }
    startTransition(async () => {
      const result = attendance
        ? await unmarkAttendanceAction(attendance.memberId).then(() => markAttendanceAction(nextMemberId))
        : await markAttendanceAction(nextMemberId)
      if (result.ok) {
        toast.success(editing ? "Asistencia actualizada" : "Asistencia registrada")
        if (editing) {
          onDone?.()
        } else {
          setMemberId("")
          setDate(todayISO())
          setMarkedAt(currentTime())
        }
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form action={submit} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-44 flex-1 flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Miembro</span>
        <Select
          value={memberId}
          onValueChange={(value) => setMemberId(value ?? "")}
          name="memberId"
          items={members.map((member) => ({ value: member.id, label: member.name }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí un miembro" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Fecha</span>
        <Input
          type="date"
          name="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-40"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Hora</span>
        <Input
          type="time"
          name="markedAt"
          value={markedAt}
          onChange={(event) => setMarkedAt(event.target.value)}
          className="w-32"
        />
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" />
        ) : (
          <CheckIcon className="size-4" aria-hidden />
        )}
        {editing ? "Guardar cambios" : "Registrar asistencia"}
      </Button>
    </form>
  )
}
