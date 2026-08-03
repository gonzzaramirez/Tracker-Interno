import { Badge } from "@/components/ui/badge"
import type {
  MemberStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/domain"

const MEMBER_STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: "Activo",
    className: "bg-foreground/5 text-foreground",
  },
  recess: {
    label: "En receso",
    className: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  },
}

const TASK_STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  queued: {
    label: "En cola",
    className: "bg-muted text-muted-foreground",
  },
  "in-progress": {
    label: "En progreso",
    className: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  },
  done: {
    label: "Hecho",
    className: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300",
  },
}

const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: "Baja",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Media",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
  high: {
    label: "Alta",
    className: "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
}

/** Member status pill (active / on recess). */
export function StatusBadge({ status }: { status: MemberStatus }) {
  const meta = MEMBER_STATUS_META[status]
  return (
    <Badge variant="outline" className={meta.className}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {meta.label}
    </Badge>
  )
}

/** Task status pill (queued / in-progress / done). */
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status]
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

/** Task priority pill (low / medium / high). */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority]
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}