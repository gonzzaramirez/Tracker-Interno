"use client"

import { useState, useTransition } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { markAttendanceAction, unmarkAttendanceAction } from "@/lib/actions/attendance"
import type { Attendance, Member } from "@/lib/domain"
import { cn } from "@/lib/utils"

type AttendanceRow = {
  attendance: Attendance
  member: Member
}

type AttendanceListProps = {
  rows: AttendanceRow[]
  /** Called with the mark to edit; the parent swaps in the edit form. */
  onEdit?: (attendance: Attendance) => void
}

/**
 * The attendance log: every mark with its date, the wall-clock time it was
 * made, the member and edit/delete actions. Empty rows (absent) are hidden.
 */
export function AttendanceList({ rows, onEdit }: AttendanceListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleting) {
      return
    }
    startTransition(async () => {
      const row = rows.find((row) => row.attendance.id === deleting)
      const result = await unmarkAttendanceAction(row?.member.id ?? "")
      if (result.ok) {
        toast.success("Asistencia eliminada")
      } else {
        toast.error(result.error)
      }
      setDeleting(null)
    })
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay marcas registradas. Usá el formulario de arriba para cargar la primera.
      </p>
    )
  }

  return (
    <>
      <ul className="divide-y divide-foreground/5">
        {rows.map(({ attendance, member }) => (
          <li
            key={attendance.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={member.displayColor ? { backgroundColor: member.displayColor } : undefined}
                aria-hidden
              />
              <span className="truncate text-sm font-medium">{member.name}</span>
              <Badge variant="outline" className="border-transparent bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300">
                Presente
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatDate(attendance.date)} ·{" "}
                <span className="font-medium text-foreground">
                  {attendance.markedAt ?? "—"}
                </span>
              </span>
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar asistencia de ${member.name}`}
                  onClick={() => onEdit(attendance)}
                >
                  <PencilIcon className="size-4" aria-hidden />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Eliminar asistencia de ${member.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleting(attendance.id)}
              >
                <Trash2Icon className="size-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta asistencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quita la marca del registro y la persona vuelve a aparecer como ausente ese día.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
