"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
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
import { EVALUATION_AREA_ICONS } from "@/components/feature/evaluation-area-icon"
import { StarRatingInput } from "@/components/feature/star-rating"
import { TiptapEditor } from "@/components/feature/tiptap-editor"
import {
  createTrackingRecordAction,
  updateTrackingRecordAction,
} from "@/lib/actions/tracking"
import {
  EVALUATION_AREAS,
  type EvaluationAreaId,
  type Member,
  type TrackingEvaluation,
} from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

/** Score map from a snapshot; 0 means the area is not evaluated. */
function toScoreMap(evaluations: TrackingEvaluation[] | undefined): Record<EvaluationAreaId, number> {
  const scores = Object.fromEntries(
    EVALUATION_AREAS.map((area) => [area.id, 0]),
  ) as Record<EvaluationAreaId, number>
  for (const entry of evaluations ?? []) {
    scores[entry.areaId] = entry.score
  }
  return scores
}

type LinkedTaskInput = {
  title: string
  description: string
}

type TrackingFormProps = {
  members: Member[]
  mode?: "create" | "edit"
  /** "single" stacks every field — used in the tracking page side column. */
  layout?: "default" | "single"
  /** Latest evaluation snapshot per member, for prefill in create mode. */
  latestEvaluations?: Record<string, TrackingEvaluation[]>
  /** Existing record values when editing. */
  record?: {
    id: string
    memberId: string
    contentHtml: string
    recordDate: string
    evaluations?: TrackingEvaluation[]
  }
  tasks?: LinkedTaskInput[]
  onDone?: () => void
  onCancel?: () => void
}

/**
 * Create/edit a tracking record: member, date, evaluation areas, rich-text
 * comment (Tiptap) and linked tasks. The general score is derived from the
 * areas server-side.
 */
export function TrackingForm({
  members,
  mode = "create",
  layout = "default",
  record,
  tasks = [],
  latestEvaluations = {},
  onDone,
  onCancel,
}: TrackingFormProps) {
  const initialMemberId = record?.memberId ?? members[0]?.id ?? ""
  const [memberId, setMemberId] = useState(initialMemberId)
  const [contentHtml, setContentHtml] = useState(record?.contentHtml ?? "")
  const [recordDate, setRecordDate] = useState(record?.recordDate ?? todayISO())
  const [linkedTasks, setLinkedTasks] = useState<LinkedTaskInput[]>(tasks)
  const [scores, setScores] = useState<Record<EvaluationAreaId, number>>(() =>
    toScoreMap(record?.evaluations ?? latestEvaluations[initialMemberId]),
  )
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const canSubmit = mode === "edit" || (memberId !== "" && contentHtml.trim() !== "")

  function prefillScoresFor(nextMemberId: string): void {
    setScores(toScoreMap(latestEvaluations[nextMemberId]))
  }

  function submit() {
    const scoredAreas = EVALUATION_AREAS.filter((area) => scores[area.id] > 0).map((area) => ({
      areaId: area.id,
      score: scores[area.id],
    }))
    const originallyEmpty = (record?.evaluations?.length ?? 0) === 0
    // Edit mode: omit the snapshot when nothing was scored before AND nothing
    // is scored now, so an old manual rating is not wiped by an empty save.
    const evaluations = scoredAreas.length === 0 && originallyEmpty ? undefined : scoredAreas

    const payload = {
      memberId,
      contentHtml,
      recordDate,
      evaluations,
      tasks: linkedTasks.map((task) => ({
        title: task.title,
        description: task.description || undefined,
      })),
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTrackingRecordAction(payload)
          : await updateTrackingRecordAction(record?.id ?? "", payload)
      if (result.ok) {
        toast.success(mode === "create" ? "Registro guardado" : "Registro actualizado")
        formRef.current?.reset()
        if (mode === "create") {
          setContentHtml("")
          setLinkedTasks([])
          prefillScoresFor(memberId)
        }
        onDone?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  const summary = useMemo(
    () => linkedTasks.filter((task) => task.title.trim()).length,
    [linkedTasks],
  )

  const fieldGrid = layout === "single" ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"

  return (
    <form
      ref={formRef}
      action={submit}
      className="grid gap-4"
      aria-label={mode === "create" ? "Nuevo registro de seguimiento" : "Editar registro de seguimiento"}
    >
      <div className={fieldGrid}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tracking-member">Miembro</Label>
          <Select
            value={memberId}
            onValueChange={(value) => {
              const next = value ?? ""
              setMemberId(next)
              prefillScoresFor(next)
            }}
            disabled={mode === "edit"}
            items={members.map((member) => ({ value: member.id, label: member.name }))}
          >
            <SelectTrigger id="tracking-member" aria-label="Miembro" className="w-full">
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
        </div>
      </div>

      <div className={fieldGrid}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tracking-date">Fecha del registro</Label>
          <Input
            id="tracking-date"
            name="recordDate"
            type="date"
            value={recordDate}
            onChange={(event) => setRecordDate(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Áreas a evaluar</Label>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EVALUATION_AREAS.map((area) => {
            const AreaIcon = EVALUATION_AREA_ICONS[area.id]
            return (
              <div
                key={area.id}
                className="flex min-w-0 flex-col gap-2 rounded-2xl bg-muted/40 p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10"
                    aria-hidden
                  >
                    <AreaIcon className="size-3.5" />
                  </span>
                  <p className="truncate text-sm font-medium text-foreground">{area.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRatingInput
                    value={scores[area.id]}
                    size="sm"
                    ariaLabelledBy={`tracking-area-${area.id}-label`}
                    onChange={(value) =>
                      setScores((current) => ({ ...current, [area.id]: value }))
                    }
                  />
                  <span
                    id={`tracking-area-${area.id}-label`}
                    className="text-xs tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    {scores[area.id] > 0 ? `${scores[area.id]}/5` : "—"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tracking-content">Comentario</Label>
        <TiptapEditor
          id="tracking-content"
          name="contentHtml"
          value={contentHtml}
          onChange={setContentHtml}
          placeholder="Qué logró, cómo viene, en qué puede crecer…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Tareas vinculadas</Label>
          <span className="text-xs text-muted-foreground">{summary} seleccionadas</span>
        </div>
        {linkedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Opcional — vinculá tareas a este registro.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedTasks.map((task, index) => (
              <li key={index} className="flex flex-wrap items-end gap-2 rounded-xl bg-muted/40 p-3">
                <div className="flex min-w-44 flex-1 flex-col gap-1">
                  <Label htmlFor={`task-title-${index}`} className="text-xs">Título</Label>
                  <Input
                    id={`task-title-${index}`}
                    value={task.title}
                    onChange={(event) => {
                      const next = [...linkedTasks]
                      next[index] = { ...task, title: event.target.value }
                      setLinkedTasks(next)
                    }}
                    placeholder="Título de la tarea"
                  />
                </div>
                <div className="flex min-w-32 flex-1 flex-col gap-1">
                  <Label htmlFor={`task-desc-${index}`} className="text-xs">Descripción</Label>
                  <Input
                    id={`task-desc-${index}`}
                    value={task.description}
                    onChange={(event) => {
                      const next = [...linkedTasks]
                      next[index] = { ...task, description: event.target.value }
                      setLinkedTasks(next)
                    }}
                    placeholder="Opcional"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar tarea vinculada"
                  onClick={() => setLinkedTasks((current) => current.filter((_, i) => i !== index))}
                >
                  <XIcon className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLinkedTasks((current) => [...current, { title: "", description: "" }])
            }
          >
            <PlusIcon className="size-4" aria-hidden />
            Agregar tarea vinculada
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? (
            <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          {mode === "create" ? "Guardar registro" : "Guardar cambios"}
        </Button>
        {mode === "edit" ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        {mode === "create" ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Limpiar formulario"
            onClick={() => {
              formRef.current?.reset()
              setContentHtml("")
              setLinkedTasks([])
              prefillScoresFor(memberId)
            }}
          >
            <Trash2Icon className="size-4" aria-hidden />
            Limpiar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
