/**
 * Pure domain types — tracking records (the core of the platform).
 *
 * A tracking record is a follow-up entry for a member: a general score derived
 * from the evaluation areas, a rich-text comment (Tiptap HTML) and optionally
 * linked tasks with their progress at the time of the record.
 */

/** The six evaluable performance areas of a tracking record. */
export const EVALUATION_AREAS = [
  {
    id: "compliance",
    name: "Cumplimiento",
    icon: "clipboard-check",
    description: "Cumple con las tareas y objetivos asignados.",
  },
  {
    id: "quality",
    name: "Calidad",
    icon: "award",
    description: "Nivel de calidad del trabajo entregado.",
  },
  {
    id: "communication",
    name: "Comunicación",
    icon: "messages-square",
    description: "Claridad, feedback y comunicación con el equipo.",
  },
  {
    id: "proactivity",
    name: "Proactividad",
    icon: "zap",
    description: "Iniciativa para resolver problemas o proponer mejoras.",
  },
  {
    id: "teamwork",
    name: "Trabajo en equipo",
    icon: "users",
    description: "Colaboración y predisposición para ayudar al equipo.",
  },
  {
    id: "attitude",
    name: "Actitud",
    icon: "smile",
    description: "Compromiso, predisposición y actitud durante la jornada.",
  },
] as const

export type EvaluationAreaId = (typeof EVALUATION_AREAS)[number]["id"]

/** One evaluated area inside a tracking record's snapshot. */
export type TrackingEvaluation = {
  areaId: EvaluationAreaId
  /** Score 1-5 at the time of the record. */
  score: number
  maxScore: number
  weight: number
}

/**
 * Per-area deltas (current − previous) between two evaluation snapshots.
 * Only areas scored on BOTH sides and whose score changed are included, so
 * untouched areas never show a false change.
 */
export function evaluationDeltas(
  previous: TrackingEvaluation[] | undefined,
  current: TrackingEvaluation[] | undefined,
): Partial<Record<EvaluationAreaId, number>> {
  const deltas: Partial<Record<EvaluationAreaId, number>> = {}
  if (!previous || !current) {
    return deltas
  }
  for (const area of EVALUATION_AREAS) {
    const prev = previous.find((entry) => entry.areaId === area.id)
    const curr = current.find((entry) => entry.areaId === area.id)
    if (prev && curr && curr.score !== prev.score) {
      deltas[area.id] = curr.score - prev.score
    }
  }
  return deltas
}

export type TrackingTask = {
  id: string
  recordId: string
  title: string
  description?: string
  /** Progress percentage, 0-100, at the time of the record. */
  progress: number
  /** ISO date (YYYY-MM-DD). */
  createdAt: string
}

export type TrackingRecord = {
  id: string
  memberId: string
  /** General score 1-5, DERIVED from the evaluation areas; null when none are scored. */
  rating: number | null
  /** Rich-text comment as Tiptap HTML (StarterKit). */
  contentHtml: string
  /** ISO date (YYYY-MM-DD) of the record. */
  recordDate: string
  /** ISO timestamp used to order records created on the same date. */
  createdAt: string
  /** Persistent insertion sequence used as the final stable tie-breaker. */
  createdSequence: number
  /** ISO timestamp of the last edit, if any. */
  updatedAt?: string
}

/** Tracking record with its linked tasks and evaluation snapshot, as shown in history/profile. */
export type TrackingRecordWithTasks = {
  record: TrackingRecord
  tasks: TrackingTask[]
  evaluations: TrackingEvaluation[]
}
