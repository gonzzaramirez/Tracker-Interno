/**
 * Deterministic seed for the in-memory store (task 1.3).
 *
 * All dates are computed relative to `new Date()` so the weekly dashboard,
 * trend chart and calendar stay populated on any day the app is opened.
 * Ids use stable, reproducible prefixes (mem-1.., task-1.., pr-1.., fb-1..,
 * sn-1.., to-1..).
 */

import type {
  Feedback,
  Member,
  ProgressRecord,
  Snippet,
  Task,
  TimeOffEntry,
} from "@/lib/domain"

export type Db = {
  members: Member[]
  tasks: Task[]
  progress: ProgressRecord[]
  feedback: Feedback[]
  snippets: Snippet[]
  timeOff: TimeOffEntry[]
  counters: {
    task: number
    progress: number
    feedback: number
    snippet: number
    timeoff: number
  }
}

/** Format a Date as ISO YYYY-MM-DD in local time. */
function iso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** ISO date N days from today (negative = past). */
function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return iso(date)
}

const MEMBERS: Member[] = [
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
    notes: "Vacation planned — see calendar.",
  },
  {
    id: "mem-6",
    name: "Julián Acosta",
    role: "Mobile",
    displayColor: "#64d2ff",
    status: "recess",
    joinedAt: daysFromNow(-150),
    notes: "On recess during the release freeze.",
  },
]

const TASKS: Task[] = [
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

const PROGRESS: ProgressRecord[] = [
  // task-1 · onboarding (chart line)
  { id: "pr-1", taskId: "task-1", date: daysFromNow(-6), value: 10, note: "Initial wireframe review." },
  { id: "pr-2", taskId: "task-1", date: daysFromNow(-4), value: 25, note: "Copy pass with Lucía." },
  { id: "pr-3", taskId: "task-1", date: daysFromNow(-2), value: 55 },
  { id: "pr-4", taskId: "task-1", date: daysFromNow(-1), value: 80, note: "Edge cases handled." },
  // task-3 — rate limiter
  { id: "pr-5", taskId: "task-3", date: daysFromNow(-5), value: 20 },
  { id: "pr-6", taskId: "task-3", date: daysFromNow(-3), value: 45 },
  { id: "pr-7", taskId: "task-3", date: daysFromNow(-1), value: 70 },
  // task-5 — tokens audit (done)
  { id: "pr-8", taskId: "task-5", date: daysFromNow(-9), value: 30 },
  { id: "pr-9", taskId: "task-5", date: daysFromNow(-7), value: 65 },
  { id: "pr-10", taskId: "task-5", date: daysFromNow(-3), value: 100, note: "Shipped." },
  // task-7 — billing regression
  { id: "pr-11", taskId: "task-7", date: daysFromNow(-3), value: 40 },
  { id: "pr-12", taskId: "task-7", date: daysFromNow(-1), value: 75 },
  // task-9 — roadmap (overdue)
  { id: "pr-13", taskId: "task-9", date: daysFromNow(-4), value: 30 },
  { id: "pr-14", taskId: "task-9", date: daysFromNow(-2), value: 50 },
  { id: "pr-15", taskId: "task-9", date: daysFromNow(-1), value: 60 },
  // task-12 — cache RFC (done)
  { id: "pr-16", taskId: "task-12", date: daysFromNow(-6), value: 100, note: "Approved in RFC review." },
]

const FEEDBACK: Feedback[] = [
  {
    id: "fb-1",
    memberId: "mem-1",
    date: daysFromNow(-2),
    rating: 5,
    content: "Catch of the week: spotted the tooltip overflow in code review before it shipped.",
    category: "praise",
  },
  {
    id: "fb-2",
    memberId: "mem-1",
    date: daysFromNow(-5),
    rating: 4,
    content: "Pairing went great. Push to propose the flow structure before diving into CSS.",
    category: "coaching",
  },
  {
    id: "fb-3",
    memberId: "mem-2",
    date: daysFromNow(-3),
    rating: 5,
    content: "Rate-limit design doc was crisp and reviewable.",
    category: "praise",
  },
  {
    id: "fb-4",
    memberId: "mem-3",
    date: daysFromNow(-4),
    rating: 5,
    content: "Token audit caught three stale mappings nobody else noticed.",
    category: "praise",
  },
  {
    id: "fb-5",
    memberId: "mem-3",
    date: daysFromNow(-8),
    rating: 3,
    content: "Flagged: handoff notes were thin, design review cycles slowed down.",
    category: "concern",
  },
  {
    id: "fb-6",
    memberId: "mem-4",
    date: daysFromNow(-1),
    rating: 4,
    content: "Strong regression discipline — keep pairing with devs before the pass.",
    category: "coaching",
  },
  {
    id: "fb-7",
    memberId: "mem-5",
    date: daysFromNow(-6),
    rating: 5,
    content: "Ran a flawless kickoff; the roadmap already feels shared, not imposed.",
    category: "praise",
  },
  {
    id: "fb-8",
    memberId: "mem-6",
    date: daysFromNow(-10),
    rating: 3,
    content: "Handover docs need more concrete steps for the incoming dev.",
    category: "concern",
  },
]

const SNIPPETS: Snippet[] = [
  {
    id: "sn-1",
    title: "Pull request opener",
    description: "Standard first paragraph for a reviewable PR description.",
    content: "## Summary\nThis PR {summary}. It closes {issue}.\n\n## Test plan\n- [ ] Manual smoke on {environment}",
    tags: ["pr", "review"],
    usageCount: 12,
    lastUsedAt: daysFromNow(-2),
  },
  {
    id: "sn-2",
    title: "Standup update",
    description: "Three-line standup format used in the daily channel.",
    content: "Yesterday: {done}. Today: {next}. Blocked by: {blocker}.",
    tags: ["standup", "rituals"],
    usageCount: 8,
    lastUsedAt: daysFromNow(-1),
  },
  {
    id: "sn-3",
    title: "Design critique round",
    description: "Invitation template for a focused design critique.",
    content: "Critique slot for {project} — {date}. Focus: {area}. Add your comments to the board.",
    tags: ["design", "feedback"],
    usageCount: 3,
    lastUsedAt: daysFromNow(-5),
  },
  {
    id: "sn-4",
    title: "Incident wrap-up",
    description: "Post-incident summary skeleton, blameless by default.",
    content: "Impact: {scope}. Root cause: {cause}. Follow-ups: {items}.",
    tags: ["incident", "postmortem"],
    usageCount: 5,
    lastUsedAt: daysFromNow(0),
  },
  {
    id: "sn-5",
    title: "1:1 agenda",
    description: "Lightweight agenda for weekly 1:1s.",
    content: "1. {highlights}\n2. {blockers}\n3. {coaching}\n4. Notes:",
    tags: ["meetings", "coaching"],
    usageCount: 6,
    lastUsedAt: daysFromNow(-3),
  },
]

const TIME_OFF: TimeOffEntry[] = [
  {
    id: "to-1",
    memberId: "mem-6",
    startDate: daysFromNow(1),
    endDate: daysFromNow(12),
    type: "recess",
    note: "Release freeze recess.",
  },
  {
    id: "to-2",
    memberId: "mem-5",
    startDate: daysFromNow(3),
    endDate: daysFromNow(6),
    type: "vacation",
    note: "Long weekend off.",
  },
  {
    id: "to-3",
    memberId: "mem-2",
    startDate: daysFromNow(9),
    endDate: daysFromNow(12),
    type: "vacation",
  },
  {
    id: "to-4",
    memberId: "mem-4",
    startDate: daysFromNow(21),
    endDate: daysFromNow(22),
    type: "other",
    note: "Test automation conference.",
  },
]

export function createSeed(): Db {
  return {
    members: [...MEMBERS],
    tasks: [...TASKS],
    progress: [...PROGRESS],
    feedback: [...FEEDBACK],
    snippets: [...SNIPPETS],
    timeOff: [...TIME_OFF],
    counters: {
      task: TASKS.length + 1,
      progress: PROGRESS.length + 1,
      feedback: FEEDBACK.length + 1,
      snippet: SNIPPETS.length + 1,
      timeoff: TIME_OFF.length + 1,
    },
  }
}