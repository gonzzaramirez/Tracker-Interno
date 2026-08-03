import type { DatabaseSync } from "node:sqlite"

import { addDays, daysFromNow } from "../domain/date"

type SeedMember = {
  id: string
  name: string
  role: string
  displayColor: string
  status: "active" | "recess"
  joinedAt: string
  notes?: string
  checkinFreqDays: number
  lastCheckinAt?: string
  nextCheckinAt: string
}

type SeedTask = {
  id: string
  memberId: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  status: "queued" | "in-progress" | "done"
  dueDate?: string
  createdAt: string
}

type SeedProgress = {
  id: string
  taskId: string
  value: number
  date: string
  note?: string
}

type SeedFeedback = {
  id: string
  memberId: string
  rating: number
  content: string
  category: "praise" | "coaching" | "concern"
  createdAt: string
}

type SeedSnippet = {
  id: string
  title: string
  description?: string
  content: string
  usageCount: number
  lastUsedAt?: string
  createdAt: string
}

type SeedTimeOff = {
  id: string
  memberId: string
  startDate: string
  endDate: string
  type: "vacation" | "license" | "sickness" | "holiday"
  status: "pending" | "approved" | "rejected"
  note?: string
  createdAt: string
}

type SeedCheckIn = {
  id: string
  memberId: string
  date: string
  semaphore: "green" | "yellow" | "red"
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
    checkinFreqDays: 30,
    lastCheckinAt: daysFromNow(-5),
    nextCheckinAt: addDays(daysFromNow(-5), 30),
  },
  {
    id: "mem-2",
    name: "Martín Duarte",
    role: "Backend",
    displayColor: "#059669",
    status: "active",
    joinedAt: daysFromNow(-360),
    checkinFreqDays: 30,
    lastCheckinAt: daysFromNow(-40),
    nextCheckinAt: addDays(daysFromNow(-40), 30),
  },
  {
    id: "mem-3",
    name: "Lucía Paredes",
    role: "Design",
    displayColor: "#bf5af2",
    status: "active",
    joinedAt: daysFromNow(-280),
    notes: "Leads the bi-weekly critique.",
    checkinFreqDays: 21,
    lastCheckinAt: daysFromNow(-10),
    nextCheckinAt: addDays(daysFromNow(-10), 21),
  },
  {
    id: "mem-4",
    name: "Tomás Roldán",
    role: "QA",
    displayColor: "#ff9f0a",
    status: "active",
    joinedAt: daysFromNow(-190),
    checkinFreqDays: 30,
    nextCheckinAt: addDays(daysFromNow(-190), 30),
  },
  {
    id: "mem-5",
    name: "Camila Torres",
    role: "Product",
    displayColor: "#ff375f",
    status: "active",
    joinedAt: daysFromNow(-95),
    notes: "Vacation planned — see calendar.",
    checkinFreqDays: 14,
    lastCheckinAt: daysFromNow(-2),
    nextCheckinAt: addDays(daysFromNow(-2), 14),
  },
  {
    id: "mem-6",
    name: "Julián Acosta",
    role: "Mobile",
    displayColor: "#64d2ff",
    status: "recess",
    joinedAt: daysFromNow(-150),
    notes: "On recess during the release freeze.",
    checkinFreqDays: 30,
    nextCheckinAt: addDays(daysFromNow(-150), 30),
  },
]

const TASKS: SeedTask[] = [
  {
    id: "task-1",
    memberId: "mem-1",
    title: "Graceful onboarding flow",
    description: "Polish the first-run experience and empty states.",
    priority: "high",
    status: "in-progress",
    dueDate: daysFromNow(0),
    createdAt: daysFromNow(-9),
  },
  {
    id: "task-2",
    memberId: "mem-1",
    title: "Fix chart tooltip overflow",
    priority: "low",
    status: "done",
    dueDate: daysFromNow(-3),
    createdAt: daysFromNow(-12),
  },
  {
    id: "task-3",
    memberId: "mem-2",
    title: "Rate-limit the public API",
    description: "Per-key quotas with a sliding window.",
    priority: "high",
    status: "in-progress",
    dueDate: daysFromNow(1),
    createdAt: daysFromNow(-6),
  },
  {
    id: "task-4",
    memberId: "mem-2",
    title: "Write migration notes for tasks table",
    priority: "medium",
    status: "queued",
    dueDate: daysFromNow(5),
    createdAt: daysFromNow(-2),
  },
  {
    id: "task-5",
    memberId: "mem-3",
    title: "Design tokens audit",
    priority: "medium",
    status: "done",
    dueDate: daysFromNow(-2),
    createdAt: daysFromNow(-10),
  },
  {
    id: "task-6",
    memberId: "mem-3",
    title: "Interactive button states",
    priority: "medium",
    status: "in-progress",
    dueDate: daysFromNow(2),
    createdAt: daysFromNow(-4),
  },
  {
    id: "task-7",
    memberId: "mem-4",
    title: "Regression pass on billing",
    priority: "high",
    status: "in-progress",
    dueDate: daysFromNow(0),
    createdAt: daysFromNow(-7),
  },
  {
    id: "task-8",
    memberId: "mem-4",
    title: "Automate e2e smoke suite",
    priority: "medium",
    status: "queued",
    dueDate: daysFromNow(7),
    createdAt: daysFromNow(-5),
  },
  {
    id: "task-9",
    memberId: "mem-5",
    title: "Q3 roadmap retro plan",
    description: "Outline sessions, owners and deliverables.",
    priority: "high",
    status: "in-progress",
    dueDate: daysFromNow(-1),
    createdAt: daysFromNow(-8),
  },
  {
    id: "task-10",
    memberId: "mem-5",
    title: "Stakeholder comms plan",
    priority: "low",
    status: "queued",
    dueDate: daysFromNow(10),
    createdAt: daysFromNow(-3),
  },
  {
    id: "task-11",
    memberId: "mem-6",
    title: "Handover notes for mobile repo",
    priority: "medium",
    status: "done",
    dueDate: daysFromNow(-20),
    createdAt: daysFromNow(-30),
  },
  {
    id: "task-12",
    memberId: "mem-2",
    title: "Cache strategy RFC",
    priority: "high",
    status: "done",
    dueDate: daysFromNow(-4),
    createdAt: daysFromNow(-15),
  },
]

const PROGRESS: SeedProgress[] = [
  { id: "pr-1", taskId: "task-1", date: daysFromNow(-6), value: 10, note: "Initial wireframe review." },
  { id: "pr-2", taskId: "task-1", date: daysFromNow(-4), value: 25, note: "Copy pass with Lucía." },
  { id: "pr-3", taskId: "task-1", date: daysFromNow(-2), value: 55 },
  { id: "pr-4", taskId: "task-1", date: daysFromNow(-1), value: 80, note: "Edge cases handled." },
  { id: "pr-5", taskId: "task-3", date: daysFromNow(-5), value: 20 },
  { id: "pr-6", taskId: "task-3", date: daysFromNow(-3), value: 45 },
  { id: "pr-7", taskId: "task-3", date: daysFromNow(-1), value: 70 },
  { id: "pr-8", taskId: "task-5", date: daysFromNow(-9), value: 30 },
  { id: "pr-9", taskId: "task-5", date: daysFromNow(-7), value: 65 },
  { id: "pr-10", taskId: "task-5", date: daysFromNow(-3), value: 100, note: "Shipped." },
  { id: "pr-11", taskId: "task-7", date: daysFromNow(-3), value: 40 },
  { id: "pr-12", taskId: "task-7", date: daysFromNow(-1), value: 75 },
  { id: "pr-13", taskId: "task-9", date: daysFromNow(-4), value: 30 },
  { id: "pr-14", taskId: "task-9", date: daysFromNow(-2), value: 50 },
  { id: "pr-15", taskId: "task-9", date: daysFromNow(-1), value: 60 },
  { id: "pr-16", taskId: "task-12", date: daysFromNow(-6), value: 100, note: "Approved in RFC review." },
]

const FEEDBACK: SeedFeedback[] = [
  {
    id: "fb-1",
    memberId: "mem-1",
    rating: 5,
    content: "Catch of the week: spotted the tooltip overflow in code review before it shipped.",
    category: "praise",
    createdAt: daysFromNow(-2),
  },
  {
    id: "fb-2",
    memberId: "mem-1",
    rating: 4,
    content: "Pairing went great. Push to propose the flow structure before diving into CSS.",
    category: "coaching",
    createdAt: daysFromNow(-5),
  },
  {
    id: "fb-3",
    memberId: "mem-2",
    rating: 5,
    content: "Rate-limit design doc was crisp and reviewable.",
    category: "praise",
    createdAt: daysFromNow(-3),
  },
  {
    id: "fb-4",
    memberId: "mem-3",
    rating: 5,
    content: "Token audit caught three stale mappings nobody else noticed.",
    category: "praise",
    createdAt: daysFromNow(-4),
  },
  {
    id: "fb-5",
    memberId: "mem-3",
    rating: 3,
    content: "Flagged: handoff notes were thin, design review cycles slowed down.",
    category: "concern",
    createdAt: daysFromNow(-8),
  },
  {
    id: "fb-6",
    memberId: "mem-4",
    rating: 4,
    content: "Strong regression discipline — keep pairing with devs before the pass.",
    category: "coaching",
    createdAt: daysFromNow(-1),
  },
  {
    id: "fb-7",
    memberId: "mem-5",
    rating: 5,
    content: "Ran a flawless kickoff; the roadmap already feels shared, not imposed.",
    category: "praise",
    createdAt: daysFromNow(-6),
  },
  {
    id: "fb-8",
    memberId: "mem-6",
    rating: 3,
    content: "Handover docs need more concrete steps for the incoming dev.",
    category: "concern",
    createdAt: daysFromNow(-10),
  },
]

const SNIPPETS: SeedSnippet[] = [
  {
    id: "sn-1",
    title: "Pull request opener",
    description: "Standard first paragraph for a reviewable PR description.",
    content: "## Summary\nThis PR summarizes the change.\n\n## Test plan\n- [ ] Manual smoke",
    usageCount: 12,
    lastUsedAt: daysFromNow(-2),
    createdAt: daysFromNow(-30),
  },
  {
    id: "sn-2",
    title: "Standup update",
    description: "Three-line standup format used in the daily channel.",
    content: "Yesterday: completed work. Today: next step. Blocked by: none.",
    usageCount: 8,
    lastUsedAt: daysFromNow(-1),
    createdAt: daysFromNow(-29),
  },
  {
    id: "sn-3",
    title: "Design critique round",
    description: "Invitation template for a focused design critique.",
    content: "Critique slot for the current project. Focus: design details. Add your comments to the board.",
    usageCount: 3,
    lastUsedAt: daysFromNow(-5),
    createdAt: daysFromNow(-28),
  },
  {
    id: "sn-4",
    title: "Incident wrap-up",
    description: "Post-incident summary skeleton, blameless by default.",
    content: "Impact: scope. Root cause: cause. Follow-ups: items.",
    usageCount: 5,
    lastUsedAt: daysFromNow(0),
    createdAt: daysFromNow(-27),
  },
  {
    id: "sn-5",
    title: "1:1 agenda",
    description: "Lightweight agenda for weekly 1:1s.",
    content: "1. Highlights\n2. Blockers\n3. Coaching\n4. Notes:",
    usageCount: 6,
    lastUsedAt: daysFromNow(-3),
    createdAt: daysFromNow(-26),
  },
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
    memberId: "mem-2",
    startDate: daysFromNow(9),
    endDate: daysFromNow(12),
    type: "vacation",
    status: "pending",
    createdAt: daysFromNow(-2),
  },
  {
    id: "to-4",
    memberId: "mem-4",
    startDate: daysFromNow(21),
    endDate: daysFromNow(22),
    type: "holiday",
    status: "approved",
    note: "Test automation conference.",
    createdAt: daysFromNow(-1),
  },
]

const CHECK_INS: SeedCheckIn[] = [
  {
    id: "ci-1",
    memberId: "mem-1",
    date: daysFromNow(-5),
    semaphore: "green",
    note: "On track for the onboarding flow.",
    createdAt: daysFromNow(-5),
  },
  {
    id: "ci-2",
    memberId: "mem-2",
    date: daysFromNow(-40),
    semaphore: "yellow",
    note: "API review needs one more pass.",
    createdAt: daysFromNow(-40),
  },
  {
    id: "ci-3",
    memberId: "mem-3",
    date: daysFromNow(-10),
    semaphore: "green",
    note: "Design critique cadence is healthy.",
    createdAt: daysFromNow(-10),
  },
  {
    id: "ci-4",
    memberId: "mem-5",
    date: daysFromNow(-2),
    semaphore: "green",
    createdAt: daysFromNow(-2),
  },
]

type CountRow = { total: number }

/** Returns true only when every user table contains zero rows. */
export function isDatabaseEmpty(db: DatabaseSync): boolean {
  const row = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM members) +
         (SELECT COUNT(*) FROM tasks) +
         (SELECT COUNT(*) FROM task_progress) +
         (SELECT COUNT(*) FROM feedback) +
         (SELECT COUNT(*) FROM snippets) +
         (SELECT COUNT(*) FROM time_off) +
         (SELECT COUNT(*) FROM check_ins) AS total`,
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
        member.checkinFreqDays,
        member.lastCheckinAt ?? null,
        member.nextCheckinAt,
      )
    }

    const insertTask = db.prepare(
      `INSERT INTO tasks
       (id, member_id, title, description, priority, status, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const task of TASKS) {
      insertTask.run(
        task.id,
        task.memberId,
        task.title,
        task.description ?? null,
        task.priority,
        task.status,
        task.dueDate ?? null,
        task.createdAt,
      )
    }

    const insertProgress = db.prepare(
      `INSERT INTO task_progress
       (id, task_id, value, progress_date, note, created_at, created_sequence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const [index, progress] of PROGRESS.entries()) {
      insertProgress.run(
        progress.id,
        progress.taskId,
        progress.value,
        progress.date,
        progress.note ?? null,
        `${progress.date}T00:00:00.000Z`,
        index + 1,
      )
    }

    const insertFeedback = db.prepare(
      `INSERT INTO feedback
       (id, member_id, rating, content, category, created_at, created_sequence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const [index, feedback] of FEEDBACK.entries()) {
      insertFeedback.run(
        feedback.id,
        feedback.memberId,
        feedback.rating,
        feedback.content,
        feedback.category,
        `${feedback.createdAt}T00:00:00.000Z`,
        index + 1,
      )
    }

    const insertSnippet = db.prepare(
      `INSERT INTO snippets
       (id, title, description, content, usage_count, last_used_at, created_at, created_sequence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const [index, snippet] of SNIPPETS.entries()) {
      insertSnippet.run(
        snippet.id,
        snippet.title,
        snippet.description ?? null,
        snippet.content,
        snippet.usageCount,
        snippet.lastUsedAt ?? null,
        `${snippet.createdAt}T00:00:00.000Z`,
        index + 1,
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

    const insertCheckIn = db.prepare(
      `INSERT INTO check_ins (id, member_id, checkin_date, semaphore, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    for (const checkIn of CHECK_INS) {
      insertCheckIn.run(
        checkIn.id,
        checkIn.memberId,
        checkIn.date,
        checkIn.semaphore,
        checkIn.note ?? null,
        checkIn.createdAt,
      )
    }

    db.exec("COMMIT")
    return true
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
