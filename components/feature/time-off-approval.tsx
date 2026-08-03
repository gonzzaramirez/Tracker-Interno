"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { approveTimeOffAction, rejectTimeOffAction } from "@/lib/actions/timeoff"
import type { TimeOffEntry, TimeOffType } from "@/lib/domain"

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
  const formatter = new Intl.DateTimeFormat("es-AR", { month: "short", day: "numeric" })
  const startLabel = formatter.format(new Date(`${start}T00:00:00`))
  const endLabel = formatter.format(new Date(`${end}T00:00:00`))
  return start === end ? startLabel : `${startLabel} – ${endLabel}`
}

/** Personal approval queue for pending time-off requests. */
export function TimeOffApproval({
  entries,
  memberNames,
}: {
  entries: TimeOffEntry[]
  memberNames: Record<string, string>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState("")
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  function transition(id: string, action: "approve" | "reject") {
    setConfirmingId(null)
    setFeedback("Guardando…")
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveTimeOffAction(id)
          : await rejectTimeOffAction(id)
      if (!result.ok) {
        setFeedback(result.error)
        toast.error(result.error)
        return
      }
      const label = action === "approve" ? "Ausencia aprobada" : "Ausencia rechazada"
      setFeedback(label)
      toast.success(label)
      router.refresh()
    })
  }

  return (
    <AppleCard>
      <AppleCardHeader>
        <div>
          <AppleCardTitle>Solicitudes pendientes</AppleCardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisá las solicitudes antes de que afecten el cronograma del equipo.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {entries.length} pendientes
        </span>
      </AppleCardHeader>

      {entries.length === 0 ? (
        <Empty className="py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckIcon />
            </EmptyMedia>
            <EmptyTitle>Sin solicitudes pendientes</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>Las solicitudes nuevas aparecerán acá para revisión.</EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="divide-y divide-foreground/5">
          {entries.map((entry) => {
            const type = TYPE_META[entry.type]
            const memberName = memberNames[entry.memberId] ?? "Miembro desconocido"
            return (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{memberName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${type.className}`}>
                      {type.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatRange(entry.startDate, entry.endDate)}</p>
                  {entry.note ? (
                    <p className="mt-1 break-words text-xs text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
                <div role="group" className="flex items-center gap-2" aria-label={`Revisar solicitud de ${memberName}`}>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    aria-label={`Aprobar ausencia de ${memberName}`}
                    onClick={() => transition(entry.id, "approve")}
                  >
                    {isPending ? <Loader2Icon className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : <CheckIcon aria-hidden />}
                    Aprobar
                  </Button>
                  {confirmingId === entry.id ? (
                    <div role="group" aria-label={`Confirmar rechazo de ${memberName}`} className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => transition(entry.id, "reject")}
                      >
                        {isPending ? <Loader2Icon className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : <XIcon aria-hidden />}
                        Confirmar rechazo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      aria-label={`Rechazar ausencia de ${memberName}`}
                      onClick={() => setConfirmingId(entry.id)}
                    >
                      <XIcon aria-hidden />
                      Rechazar
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="text-sm text-muted-foreground" aria-live="polite" role="status">
        {feedback}
      </p>
    </AppleCard>
  )
}
