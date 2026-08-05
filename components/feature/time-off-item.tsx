"use client"

import { useState, useTransition } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeOffForm } from "@/components/feature/time-off-form"
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
import { deleteTimeOffAction } from "@/lib/actions/timeoff"
import type { Member, TimeOffEntry, TimeOffType } from "@/lib/domain"
import { cn } from "@/lib/utils"

const TYPE_META: Record<TimeOffType, { label: string; className: string }> = {
  vacation: {
    label: "Vacaciones",
    className: "bg-timeoff-vacation/10 text-timeoff-vacation",
  },
  license: {
    label: "Licencia",
    className: "bg-timeoff-license/10 text-timeoff-license",
  },
  sickness: {
    label: "Enfermedad",
    className: "bg-timeoff-sickness/10 text-timeoff-sickness",
  },
  holiday: {
    label: "Feriado",
    className: "bg-timeoff-holiday/10 text-timeoff-holiday",
  },
}

function formatRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const startLabel = startDate.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
  const endLabel = endDate.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
  return start === end ? startLabel : `${startLabel} – ${endLabel}`
}

type TimeOffItemProps = {
  entry: TimeOffEntry
  member: Member
  members: Member[]
}

/** One time-off entry with inline edit and delete (with confirmation). */
export function TimeOffItem({ entry, member, members }: TimeOffItemProps) {
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const type = TYPE_META[entry.type]

  function remove() {
    setConfirmOpen(false)
    startTransition(async () => {
      const result = await deleteTimeOffAction(entry.id)
      if (result.ok) {
        toast.success("Ausencia eliminada")
      } else {
        toast.error(result.error)
      }
    })
  }

  if (editing) {
    return (
      <div className="rounded-2xl bg-muted/40 p-4">
        <TimeOffForm
          members={members}
          entry={{
            id: entry.id,
            memberId: entry.memberId,
            startDate: entry.startDate,
            endDate: entry.endDate,
            type: entry.type,
            note: entry.note,
          }}
          onClose={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{member.name}</p>
          <Badge variant="outline" className={cn("border-transparent", type.className)}>
            {type.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {formatRange(entry.startDate, entry.endDate)}
        </p>
        {entry.note ? <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Editar ausencia"
          onClick={() => setEditing(true)}
        >
          <PencilIcon className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Eliminar ausencia"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon className="size-4" aria-hidden />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ausencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quita del calendario. Esta acción no se puede deshacer.
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
