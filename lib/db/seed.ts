import type { DatabaseSync } from "node:sqlite"

import { addDays, daysFromNow, todayISO } from "../domain/date"

type SeedMember = {
  id: string
  name: string
  role: string
  displayColor: string
  status: "active" | "recess"
  joinedAt: string
  notes?: string
}

type SeedTrackingRecord = {
  id: string
  memberId: string
  rating: number
  contentHtml: string
  recordDate: string
  createdAt: string
  createdSequence: number
}

type SeedTrackingTask = {
  id: string
  recordId: string
  title: string
  description?: string
  progress: number
  createdAt: string
}

type SeedTrackingEvaluation = {
  id: string
  recordId: string
  areaId: "compliance" | "quality" | "communication" | "proactivity" | "teamwork" | "attitude"
  score: number
  createdAt: string
}

type SeedTimeOff = {
  id: string
  memberId: string
  startDate: string
  endDate: string
  type: "vacation" | "license" | "sickness" | "holiday"
  status: "approved"
  note?: string
  createdAt: string
}

const MEMBERS: SeedMember[] = [
  {
    id: "mem-1",
    name: "Sofía Herrera",
    role: "Frontend",
    displayColor: "#0a84ff",
    status: "active",
    joinedAt: daysFromNow(-420),
    notes: "Owns the design system workstream.",
  },
  {
    id: "mem-2",
    name: "Martín Duarte",
    role: "Backend",
    displayColor: "#059669",
    status: "active",
    joinedAt: daysFromNow(-360),
  },
  {
    id: "mem-3",
    name: "Lucía Paredes",
    role: "Design",
    displayColor: "#bf5af2",
    status: "active",
    joinedAt: daysFromNow(-280),
    notes: "Leads the bi-weekly critique.",
  },
  {
    id: "mem-4",
    name: "Tomás Roldán",
    role: "QA",
    displayColor: "#ff9f0a",
    status: "active",
    joinedAt: daysFromNow(-190),
  },
  {
    id: "mem-5",
    name: "Camila Torres",
    role: "Product",
    displayColor: "#ff375f",
    status: "active",
    joinedAt: daysFromNow(-95),
  },
  {
    id: "mem-6",
    name: "Julián Acosta",
    role: "Mobile",
    displayColor: "#64d2ff",
    status: "recess",
    joinedAt: daysFromNow(-150),
  },
]

const TRACKING_RECORDS: SeedTrackingRecord[] = [
  // Sofía — improving 3 → 4 → 5
  {
    id: "tr-seed-1",
    memberId: "mem-1",
    rating: 3,
    contentHtml:
      "<p>Arrancó el sprint con dudas sobre el flujo de onboarding; definimos el alcance juntos.</p>",
    recordDate: daysFromNow(-21),
    createdAt: `${daysFromNow(-21)}T09:00:00.000Z`,
    createdSequence: 1,
  },
  {
    id: "tr-seed-2",
    memberId: "mem-1",
    rating: 4,
    contentHtml:
      "<p>Entregó la primera versión del flujo con buenas prácticas de accesibilidad.</p>",
    recordDate: daysFromNow(-7),
    createdAt: `${daysFromNow(-7)}T09:00:00.000Z`,
    createdSequence: 2,
  },
  {
    id: "tr-seed-3",
    memberId: "mem-1",
    rating: 5,
    contentHtml:
      "<p>Catch de la semana: detectó un overflow del tooltip en code review antes de que salga.</p>",
    recordDate: daysFromNow(-2),
    createdAt: `${daysFromNow(-2)}T09:00:00.000Z`,
    createdSequence: 3,
  },
  // Martín — stable with dips
  {
    id: "tr-seed-4",
    memberId: "mem-2",
    rating: 4,
    contentHtml: "<p>El rate-limit del API quedó revisado; falta el RFC de caché.</p>",
    recordDate: daysFromNow(-14),
    createdAt: `${daysFromNow(-14)}T09:00:00.000Z`,
    createdSequence: 4,
  },
  {
    id: "tr-seed-5",
    memberId: "mem-2",
    rating: 3,
    contentHtml:
      "<p>Se atrasó con la migración de notas. Bloqueado por dependencias del equipo de infra.</p>",
    recordDate: daysFromNow(-5),
    createdAt: `${daysFromNow(-5)}T09:00:00.000Z`,
    createdSequence: 5,
  },
  {
    id: "tr-seed-6",
    memberId: "mem-2",
    rating: 4,
    contentHtml: "<p>Desbloqueó la dependencia y recuperó el ritmo de entrega.</p>",
    recordDate: daysFromNow(-1),
    createdAt: `${daysFromNow(-1)}T09:00:00.000Z`,
    createdSequence: 6,
  },
  // Lucía — solid, slight dip then recovery
  {
    id: "tr-seed-7",
    memberId: "mem-3",
    rating: 5,
    contentHtml: "<p>El token audit detectó tres mappings obsoletos que nadie había visto.</p>",
    recordDate: daysFromNow(-9),
    createdAt: `${daysFromNow(-9)}T09:00:00.000Z`,
    createdSequence: 7,
  },
  {
    id: "tr-seed-8",
    memberId: "mem-3",
    rating: 4,
    contentHtml: "<p>Notas de handoff un poco flojas; lo charlamos y ya las mejoró.</p>",
    recordDate: daysFromNow(-3),
    createdAt: `${daysFromNow(-3)}T09:00:00.000Z`,
    createdSequence: 8,
  },
  // Tomás — consistent
  {
    id: "tr-seed-9",
    memberId: "mem-4",
    rating: 4,
    contentHtml: "<p>Buena disciplina de regresión. Sigue coordinando con devs antes del pase.</p>",
    recordDate: daysFromNow(-4),
    createdAt: `${daysFromNow(-4)}T09:00:00.000Z`,
    createdSequence: 9,
  },
  // Camila — improving fast
  {
    id: "tr-seed-10",
    memberId: "mem-5",
    rating: 4,
    contentHtml: "<p>Kickoff del roadmap impecable; el plan ya se siente compartido.</p>",
    recordDate: daysFromNow(-10),
    createdAt: `${daysFromNow(-10)}T09:00:00.000Z`,
    createdSequence: 10,
  },
  {
    id: "tr-seed-11",
    memberId: "mem-5",
    rating: 5,
    contentHtml:
      "<p>Presentó el plan de comunicación con stakeholders; muy claro y accionable.</p>",
    recordDate: daysFromNow(-1),
    createdAt: `${daysFromNow(-1)}T09:00:00.000Z`,
    createdSequence: 11,
  },
  // Julián — on recess, last record older
  {
    id: "tr-seed-12",
    memberId: "mem-6",
    rating: 3,
    contentHtml: "<p>Docs de handover necesitan pasos más concretos para quien tome el repo.</p>",
    recordDate: daysFromNow(-25),
    createdAt: `${daysFromNow(-25)}T09:00:00.000Z`,
    createdSequence: 12,
  },
]

const TRACKING_TASKS: SeedTrackingTask[] = [
  {
    id: "tt-seed-1",
    recordId: "tr-seed-2",
    title: "Flujo de onboarding",
    description: "Primera versión del flujo de alta.",
    progress: 60,
    createdAt: `${daysFromNow(-7)}T09:00:00.000Z`,
  },
  {
    id: "tt-seed-2",
    recordId: "tr-seed-3",
    title: "Onboarding flow",
    description: "Polish de la primera experiencia y empty states.",
    progress: 100,
    createdAt: `${daysFromNow(-2)}T09:00:00.000Z`,
  },
  {
    id: "tt-seed-3",
    recordId: "tr-seed-5",
    title: "Rate-limit del API público",
    description: "Cuotas por key con ventana deslizante.",
    progress: 30,
    createdAt: `${daysFromNow(-5)}T09:00:00.000Z`,
  },
  {
    id: "tt-seed-4",
    recordId: "tr-seed-9",
    title: "Regression pass on billing",
    description: "Pase de regresión sobre facturación.",
    progress: 100,
    createdAt: `${daysFromNow(-4)}T09:00:00.000Z`,
  },
]

// Evaluation snapshots: Sofía improves quality 3 → 4 → 5 and communication
// 3 → 3 → 4; Martín's quality dips 4 → 3 and recovers to 4.
const TRACKING_EVALUATIONS: SeedTrackingEvaluation[] = [
  { id: "te-seed-1", recordId: "tr-seed-1", areaId: "quality", score: 3, createdAt: `${daysFromNow(-21)}T09:00:00.000Z` },
  { id: "te-seed-2", recordId: "tr-seed-1", areaId: "communication", score: 3, createdAt: `${daysFromNow(-21)}T09:00:00.000Z` },
  { id: "te-seed-3", recordId: "tr-seed-1", areaId: "attitude", score: 4, createdAt: `${daysFromNow(-21)}T09:00:00.000Z` },
  { id: "te-seed-4", recordId: "tr-seed-2", areaId: "quality", score: 4, createdAt: `${daysFromNow(-7)}T09:00:00.000Z` },
  { id: "te-seed-5", recordId: "tr-seed-2", areaId: "communication", score: 3, createdAt: `${daysFromNow(-7)}T09:00:00.000Z` },
  { id: "te-seed-6", recordId: "tr-seed-2", areaId: "attitude", score: 4, createdAt: `${daysFromNow(-7)}T09:00:00.000Z` },
  { id: "te-seed-7", recordId: "tr-seed-3", areaId: "quality", score: 5, createdAt: `${daysFromNow(-2)}T09:00:00.000Z` },
  { id: "te-seed-8", recordId: "tr-seed-3", areaId: "communication", score: 4, createdAt: `${daysFromNow(-2)}T09:00:00.000Z` },
  { id: "te-seed-9", recordId: "tr-seed-3", areaId: "attitude", score: 5, createdAt: `${daysFromNow(-2)}T09:00:00.000Z` },
  { id: "te-seed-10", recordId: "tr-seed-4", areaId: "quality", score: 4, createdAt: `${daysFromNow(-14)}T09:00:00.000Z` },
  { id: "te-seed-11", recordId: "tr-seed-4", areaId: "teamwork", score: 4, createdAt: `${daysFromNow(-14)}T09:00:00.000Z` },
  { id: "te-seed-12", recordId: "tr-seed-5", areaId: "quality", score: 3, createdAt: `${daysFromNow(-5)}T09:00:00.000Z` },
  { id: "te-seed-14", recordId: "tr-seed-6", areaId: "quality", score: 4, createdAt: `${daysFromNow(-1)}T09:00:00.000Z` },
  { id: "te-seed-15", recordId: "tr-seed-6", areaId: "teamwork", score: 4, createdAt: `${daysFromNow(-1)}T09:00:00.000Z` },
]

const TIME_OFF: SeedTimeOff[] = [
  {
    id: "to-1",
    memberId: "mem-6",
    startDate: daysFromNow(1),
    endDate: daysFromNow(12),
    type: "holiday",
    status: "approved",
    note: "Release freeze recess.",
    createdAt: daysFromNow(-4),
  },
  {
    id: "to-2",
    memberId: "mem-5",
    startDate: daysFromNow(3),
    endDate: daysFromNow(6),
    type: "vacation",
    status: "approved",
    note: "Long weekend off.",
    createdAt: daysFromNow(-3),
  },
  {
    id: "to-3",
    memberId: "mem-4",
    startDate: daysFromNow(21),
    endDate: daysFromNow(22),
    type: "holiday",
    status: "approved",
    note: "Test automation conference.",
    createdAt: daysFromNow(-1),
  },
]

type CountRow = { total: number }

/** Returns true only when every user table contains zero rows. */
export function isDatabaseEmpty(db: DatabaseSync): boolean {
  const row = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM members) +
         (SELECT COUNT(*) FROM tracking_records) +
         (SELECT COUNT(*) FROM time_off) AS total`,
    )
    .get() as CountRow
  return row.total === 0
}

/** Seed the deterministic demo fixture once, returning whether it was applied. */
export function seedIfEmpty(db: DatabaseSync): boolean {
  if (!isDatabaseEmpty(db)) {
    return false
  }

  db.exec("BEGIN")
  try {
    const insertMember = db.prepare(
      `INSERT INTO members
       (id, name, role, display_color, status, joined_at, notes, checkin_freq_days, last_checkin_at, next_checkin_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const member of MEMBERS) {
      insertMember.run(
        member.id,
        member.name,
        member.role,
        member.displayColor,
        member.status,
        member.joinedAt,
        member.notes ?? null,
        30,
        null,
        addDays(member.joinedAt, 30),
      )
    }

    const insertTracking = db.prepare(
      `INSERT INTO tracking_records
       (id, member_id, rating, content_html, record_date, created_at, created_sequence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const record of TRACKING_RECORDS) {
      insertTracking.run(
        record.id,
        record.memberId,
        record.rating,
        record.contentHtml,
        record.recordDate,
        record.createdAt,
        record.createdSequence,
      )
    }

    const insertTrackingTask = db.prepare(
      `INSERT INTO tracking_tasks
       (id, record_id, title, description, progress, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    for (const task of TRACKING_TASKS) {
      insertTrackingTask.run(
        task.id,
        task.recordId,
        task.title,
        task.description ?? null,
        task.progress,
        task.createdAt,
      )
    }

    const insertTrackingEvaluation = db.prepare(
      `INSERT INTO tracking_evaluations
       (id, record_id, area_id, score, max_score, weight, created_at)
       VALUES (?, ?, ?, ?, 5, 1, ?)`,
    )
    for (const evaluation of TRACKING_EVALUATIONS) {
      insertTrackingEvaluation.run(
        evaluation.id,
        evaluation.recordId,
        evaluation.areaId,
        evaluation.score,
        evaluation.createdAt,
      )
    }

    const insertTimeOff = db.prepare(
      `INSERT INTO time_off
       (id, member_id, start_date, end_date, type, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const entry of TIME_OFF) {
      insertTimeOff.run(
        entry.id,
        entry.memberId,
        entry.startDate,
        entry.endDate,
        entry.type,
        entry.status,
        entry.note ?? null,
        entry.createdAt,
      )
    }

    // Demo attendance: most active members marked present today, with
    // staggered arrival times.
    const insertAttendance = db.prepare(
      `INSERT INTO attendance (id, member_id, date, marked_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    const today = todayISO()
    const PRESENT_TODAY: Array<[string, string]> = [
      ["mem-1", "09:02"],
      ["mem-2", "09:15"],
      ["mem-3", "09:31"],
      ["mem-4", "09:44"],
      ["mem-5", "10:02"],
    ]
    for (const [index, [memberId, markedAt]] of PRESENT_TODAY.entries()) {
      insertAttendance.run(`att-seed-${index + 1}`, memberId, today, markedAt, today)
    }

    db.exec("COMMIT")
    return true
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
