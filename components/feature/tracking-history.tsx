"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { StarRating } from "@/components/feature/star-rating"
import { TrackingForm } from "@/components/feature/tracking-form"
import { TrackingRecordCard } from "@/components/feature/tracking-record-card"
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
import { deleteTrackingRecordAction } from "@/lib/actions/tracking"
import type { Member, TrackingRecordWithTasks } from "@/lib/domain"

type TrackingHistoryProps = {
  member: Member
  entries: TrackingRecordWithTasks[]
}

/**
 * One member's chronological history with inline edit/delete. Editing swaps
 * the section into the shared TrackingForm; deleting asks for confirmation.
 */
export function TrackingHistory({ member, entries }: TrackingHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (entries.length === 0) {
    return (
      <section aria-label={`Historial de ${member.name}`} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{member.name}</h2>
          <span className="text-xs text-muted-foreground">Sin registros</span>
        </div>
      </section>
    )
  }

  const editingEntry = entries.find((entry) => entry.record.id === editingId)

  function confirmDelete() {
    if (!deleting) {
      return
    }
    startTransition(async () => {
      const result = await deleteTrackingRecordAction(deleting)
      if (result.ok) {
        toast.success("Registro eliminado")
      } else {
        toast.error(result.error)
      }
      setDeleting(null)
    })
  }

  return (
    <section aria-label={`Historial de ${member.name}`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">{member.name}</h2>
        {entries.length > 0 ? (
          <div className="flex items-center gap-2">
            {entries[0].record.rating !== null ? (
              <StarRating value={entries[0].record.rating} size="sm" />
            ) : (
              <span className="text-xs text-muted-foreground">Sin nota</span>
            )}
            <span className="text-xs tabular-nums text-muted-foreground">
              {entries.length} registro{entries.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}
      </div>

      {editingEntry ? (
        <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
          <TrackingForm
            mode="edit"
            members={[member]}
            record={{
              id: editingEntry.record.id,
              memberId: member.id,
              contentHtml: editingEntry.record.contentHtml,
              recordDate: editingEntry.record.recordDate,
              evaluations: editingEntry.evaluations,
            }}
            tasks={editingEntry.tasks.map((task) => ({
              title: task.title,
              description: task.description ?? "",
            }))}
            onDone={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, index) => (
            <TrackingRecordCard
              key={entry.record.id}
              entry={entry}
              previousEvaluations={
                entries
                  .slice(index + 1)
                  .find((older) => older.evaluations.length > 0)?.evaluations
              }
              onEdit={() => setEditingId(entry.record.id)}
              onDelete={() => setDeleting(entry.record.id)}
            />
          ))}
        </ul>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra la nota, el estado y las tareas vinculadas del historial de {member.name}.
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
    </section>
  )
}
