"use client"

import { TrendingUpIcon } from "lucide-react"

import { EVALUATION_AREA_ICONS } from "@/components/feature/evaluation-area-icon"
import { StarRating } from "@/components/feature/star-rating"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { EVALUATION_AREAS, type TrackingRecordWithTasks } from "@/lib/domain"

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type Change = {
  from: number
  to: number
  date: string
}

type EvaluationEvolutionProps = {
  /** Records ordered oldest-first, with their evaluation snapshots. */
  entries: TrackingRecordWithTasks[]
  memberName: string
}

/**
 * Per-area score history of a member: current score per area plus every
 * change with the date it happened (e.g. "Calidad subió de 4 a 5 el 12 jul").
 * Only areas with at least one evaluation are shown.
 */
export function EvaluationEvolution({ entries, memberName }: EvaluationEvolutionProps) {
  const hasAny = entries.some((entry) => entry.evaluations.length > 0)

  if (!hasAny) {
    return (
      <Empty className="min-h-48">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUpIcon className="size-4" aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Sin evaluación por áreas aún</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Cuando cargues áreas de evaluación en los registros de {memberName}, la evolución
            de cada una aparecerá acá.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <ul className="space-y-3">
      {EVALUATION_AREAS.map((area) => {
        const AreaIcon = EVALUATION_AREA_ICONS[area.id]
        const series = entries
          .filter((entry) => entry.evaluations.some((entry) => entry.areaId === area.id))
          .map((entry) => ({
            score: entry.evaluations.find((evaluation) => evaluation.areaId === area.id)?.score ?? 0,
            date: entry.record.recordDate,
          }))
        if (series.length === 0) {
          return null
        }
        const latest = series[series.length - 1]
        const changes: Change[] = []
        for (let i = 1; i < series.length; i += 1) {
          if (series[i].score !== series[i - 1].score) {
            changes.push({ from: series[i - 1].score, to: series[i].score, date: series[i].date })
          }
        }

        return (
          <li
            key={area.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10"
              aria-hidden
            >
              <AreaIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{area.name}</p>
              {changes.length === 0 ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sin cambios desde el {formatDate(series[0].date)}.
                </p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {changes.map((change, index) => {
                    const isUp = change.to > change.from
                    return (
                      <li
                        key={index}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                          isUp
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        <span>
                          {change.from} → {change.to}
                        </span>
                        <span className="font-semibold">
                          {isUp ? "+" : ""}
                          {change.to - change.from}
                        </span>
                        <span className="font-normal opacity-70">· {formatDate(change.date)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <StarRating value={latest.score} size="sm" />
              <span className="text-xs tabular-nums text-muted-foreground">
                {latest.score}/5 actual
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
