import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { EVALUATION_AREA_ICONS } from "@/components/feature/evaluation-area-icon"
import { StarRating } from "@/components/feature/star-rating"
import { TiptapView } from "@/components/feature/tiptap-view"
import {
  EVALUATION_AREAS,
  evaluationDeltas,
  type EvaluationAreaId,
  type TrackingEvaluation,
  type TrackingRecordWithTasks,
} from "@/lib/domain"
import { formatArgDateTime, toArgTime } from "@/lib/domain/date"

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** HH:MM (Argentina time) of an ISO timestamp, for the "reported at" hint. */
function toArgTimeDisplay(iso: string): string {
  return toArgTime(new Date(iso))
}

type ChangePillProps = {
  deltas: Partial<Record<EvaluationAreaId, number>>
}

/** Green indicator on the collapsible header: "hubo cambios" with direction. */
function ChangePill({ deltas }: ChangePillProps) {
  const values = Object.values(deltas)
  const up = values.filter((value) => value > 0).length
  const down = values.filter((value) => value < 0).length
  const total = values.length

  let icon = ArrowUpDownIcon
  let label = `${total} cambios`
  if (down === 0) {
    icon = TrendingUpIcon
    label = `${total} subida${total === 1 ? "" : "s"}`
  } else if (up === 0) {
    icon = TrendingDownIcon
    label = `${total} bajada${total === 1 ? "" : "s"}`
  }
  const Icon = icon

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}

type TrackingRecordCardProps = {
  entry: TrackingRecordWithTasks
  /** Evaluation snapshot of the previous record (optional — enables deltas). */
  previousEvaluations?: TrackingEvaluation[]
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * One follow-up record in the history list: score, rich-text comment, a
 * collapsible evaluation section (collapsed by default so the text leads) and
 * linked tasks. When areas changed vs the previous record, the collapsible
 * header shows a green indicator with the direction of the changes.
 */
export function TrackingRecordCard({
  entry,
  previousEvaluations,
  onEdit,
  onDelete,
}: TrackingRecordCardProps) {
  const { record, tasks, evaluations } = entry
  const deltas = evaluationDeltas(previousEvaluations, evaluations)
  const hasChanges = Object.keys(deltas).length > 0

  return (
    <li className="rounded-2xl bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {record.rating !== null ? (
            <StarRating value={record.rating} size="sm" />
          ) : (
            <span className="text-xs text-muted-foreground">Sin nota</span>
          )}
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDate(record.recordDate)}
          </span>
          <span
            className="text-xs tabular-nums text-muted-foreground"
            title={`Reportado el ${formatArgDateTime(record.createdAt)}`}
          >
            · {toArgTimeDisplay(record.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Editar registro"
              onClick={onEdit}
            >
              <PencilIcon className="size-4" aria-hidden />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar registro"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2Icon className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      <TiptapView
        html={record.contentHtml}
        className="prose prose-sm mt-2 max-w-none text-sm text-foreground"
      />

      {evaluations.length > 0 ? (
        <details className="group mt-3 border-t border-foreground/5 pt-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg py-1 select-none [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-1.5">
              <ChevronRightIcon
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
                aria-hidden
              />
              <span className="text-xs font-medium text-muted-foreground">Evaluación</span>
              <span className="text-xs tabular-nums text-muted-foreground/70">
                {evaluations.length} área{evaluations.length === 1 ? "" : "s"}
              </span>
            </span>
            {hasChanges ? <ChangePill deltas={deltas} /> : null}
          </summary>

          <div className="mt-2 space-y-2">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {EVALUATION_AREAS.filter((area) =>
                evaluations.some((entry) => entry.areaId === area.id),
              ).map((area) => {
                const score = evaluations.find((entry) => entry.areaId === area.id)?.score ?? 0
                const delta = deltas[area.id]
                const AreaIcon = EVALUATION_AREA_ICONS[area.id]
                return (
                  <li
                    key={area.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-background px-2.5 py-1.5 ring-1 ring-foreground/10"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <AreaIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-xs font-medium text-foreground">
                        {area.name}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {score}/{5}
                      </span>
                      {delta === undefined ? null : delta > 0 ? (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-600"
                          aria-label={`${area.name} subió ${delta} punto${delta === 1 ? "" : "s"}`}
                        >
                          <ArrowUpIcon className="size-3" aria-hidden />
                          {delta}
                        </span>
                      ) : delta < 0 ? (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-rose-600"
                          aria-label={`${area.name} bajó ${Math.abs(delta)} punto${delta === -1 ? "" : "s"}`}
                        >
                          <ArrowDownIcon className="size-3" aria-hidden />
                          {delta}
                        </span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
            {previousEvaluations && previousEvaluations.length > 0 && !hasChanges ? (
              <p className="text-xs text-muted-foreground">
                Sin cambios en la evaluación respecto del registro anterior.
              </p>
            ) : null}
          </div>
        </details>
      ) : null}

      {tasks.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-foreground/10"
              title={task.description}
            >
              {task.title}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
