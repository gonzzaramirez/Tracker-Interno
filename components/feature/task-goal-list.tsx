"use client"

import { useMemo, useTransition } from "react"
import { ArchiveIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardDescription, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { archiveTaskGoalAction, deleteTaskGoalAction } from "@/lib/actions/tasks"
import { SHEET_GOAL_TYPES_LABELS } from "@/lib/domain/sheet"
import type { TaskGoalView } from "@/lib/services/task-sheets"
import { cn } from "@/lib/utils"

/** Fecha corta es-AR: "7 ago". */
function formatShortDate(dateISO: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(`${dateISO}T00:00:00`),
  )
}

function formatPeriod(view: TaskGoalView): string {
  if (view.period.startDate === view.period.endDate) {
    return formatShortDate(view.period.startDate)
  }
  return `${formatShortDate(view.period.startDate)} → ${formatShortDate(view.period.endDate)}`
}

type TaskGoalPeriod = {
  key: string
  type: TaskGoalView["goal"]["type"]
  startDate: string
  endDate: string
  views: TaskGoalView[]
}

type TaskGoalGroup = {
  taskId: string
  taskName: string
  periods: TaskGoalPeriod[]
}

type TaskGoalListProps = {
  views: TaskGoalView[]
  /** PM read-only: oculta las acciones de archivar/eliminar. */
  readOnly?: boolean
  /** Cuando es false, omite el encabezado de la tarea (contextos de una sola tarea). */
  showTaskHeader?: boolean
}

/**
 * Lista de objetivos de planilla agrupada por TAREA → PERÍODO → OBJETIVO.
 * Un período es el rango concreto que define el tipo (diario/semanal/mensual)
 * anclado a su fecha; los objetivos que comparten rango se agrupan juntos.
 * Compartida entre /goals, el detalle de tarea y la vista PM (readOnly).
 */
export function TaskGoalList({ views, readOnly = false, showTaskHeader = true }: TaskGoalListProps) {
  const [isPending, startTransition] = useTransition()

  function archive(goalId: string) {
    startTransition(async () => {
      const result = await archiveTaskGoalAction(goalId)
      if (result.ok) toast.success("Objetivo archivado")
      else toast.error(result.error)
    })
  }

  function remove(goalId: string) {
    startTransition(async () => {
      const result = await deleteTaskGoalAction(goalId)
      if (result.ok) toast.success("Objetivo eliminado")
      else toast.error(result.error)
    })
  }

  const groups = useMemo<TaskGoalGroup[]>(() => {
    const byTask = new Map<string, TaskGoalGroup>()
    for (const view of views) {
      let group = byTask.get(view.goal.taskId)
      if (!group) {
        group = { taskId: view.goal.taskId, taskName: view.taskName, periods: [] }
        byTask.set(view.goal.taskId, group)
      }
      const periodKey = `${view.goal.type}|${view.period.startDate}|${view.period.endDate}`
      let period = group.periods.find((p) => p.key === periodKey)
      if (!period) {
        period = {
          key: periodKey,
          type: view.goal.type,
          startDate: view.period.startDate,
          endDate: view.period.endDate,
          views: [],
        }
        group.periods.push(period)
      }
      period.views.push(view)
    }
    const sorted: TaskGoalGroup[] = [...byTask.values()].sort((a, b) =>
      a.taskName.localeCompare(b.taskName, "es"),
    )
    for (const group of sorted) {
      group.periods.sort(
        (a, b) =>
          b.endDate.localeCompare(a.endDate) ||
          b.startDate.localeCompare(a.startDate),
      )
    }
    return sorted
  }, [views])

  if (views.length === 0) {
    return (
      <AppleCard>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <UsersIcon className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Todavía no hay objetivos de planilla — se crean desde el detalle de una tarea con planilla.
          </p>
        </div>
      </AppleCard>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.taskId} className="space-y-3" aria-label={`Tarea ${group.taskName}`}>
          {showTaskHeader ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">{group.taskName}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {group.periods.reduce((sum, p) => sum + p.views.length, 0)} objetivo(s)
              </span>
            </div>
          ) : null}

          {group.periods.map((period) => (
            <div key={period.key} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-foreground/5 text-foreground">
                  {SHEET_GOAL_TYPES_LABELS[period.type]}
                </Badge>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  período {formatPeriod(period.views[0])}
                </span>
              </div>

              {period.views.map((view) => (
                <AppleCard key={view.goal.id}>
                  <AppleCardHeader>
                    <div className="min-w-0">
                      <AppleCardTitle>{view.goal.name}</AppleCardTitle>
                      <AppleCardDescription>
                        meta {view.goal.target} por usuario
                        {view.goal.memberIds.length > 0
                          ? ` · ${view.goal.memberIds.length} miembro(s)`
                          : " · todos los miembros"}
                      </AppleCardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={view.goal.status === "active" ? "bg-foreground/5 text-foreground" : "bg-muted text-muted-foreground"}
                      >
                        {view.goal.status === "active" ? "Activo" : "Archivado"}
                      </Badge>
                      {!readOnly && view.goal.status === "active" ? (
                        <>
                          <Button type="button" variant="ghost" size="xs" onClick={() => archive(view.goal.id)} disabled={isPending}>
                            <ArchiveIcon className="size-3.5" aria-hidden />
                            Archivar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button type="button" variant="ghost" size="xs" className="text-destructive hover:text-destructive" disabled={isPending} />
                              }
                            >
                              <Trash2Icon className="size-3.5" aria-hidden />
                              Eliminar
                            </AlertDialogTrigger>
                            <AlertDialogContent size="sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este objetivo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se quita del historial. No se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => remove(view.goal.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : null}
                    </div>
                  </AppleCardHeader>

                  {view.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      La tarea no tiene miembros mapeados a la planilla.
                    </p>
                  ) : (
                    <ul className="divide-y divide-foreground/5">
                      {view.rows.map((row) => {
                        const done = row.done >= row.target
                        return (
                          <li key={row.memberId} className="flex flex-wrap items-center gap-3 py-3">
                            <div className="min-w-0 flex-1 basis-40">
                              <p className="truncate text-sm font-medium text-foreground">{row.memberName}</p>
                              <p className="text-xs tabular-nums text-muted-foreground">
                                {row.done} de {row.target} · hard {row.hardMatch} · soft {row.softMatch} · not_found {row.notFound}
                              </p>
                            </div>
                            <div className="flex min-w-32 flex-1 items-center gap-2">
                              <Progress value={row.progressPct} className="flex-1" />
                              <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                {row.progressPct}%
                              </span>
                            </div>
                            <span
                              className={cn(
                                "w-14 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                                done
                                  ? "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300"
                                  : "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300",
                              )}
                            >
                              {row.delta >= 0 ? `+${row.delta}` : String(row.delta)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </AppleCard>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
