import {
  CalendarClockIcon,
  CalendarDaysIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type { WeekHighlight, WeekHighlightKind } from "@/lib/domain"
import { cn } from "@/lib/utils"

const KIND_META: Record<
  WeekHighlightKind,
  { label: string; icon: typeof CalendarDaysIcon; className: string }
> = {
  "due-today": {
    label: "Due today",
    icon: CalendarDaysIcon,
    className:
      "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  },
  overdue: {
    label: "Overdue",
    icon: TriangleAlertIcon,
    className:
      "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
  "time-off": {
    label: "Time off",
    icon: CalendarClockIcon,
    className:
      "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  },
}

/**
 * Compact chips with the current-week highlights for one member
 * (REQ-WD-001). Renders nothing when there are no highlights.
 */
export function WeekHighlights({ highlights }: { highlights: WeekHighlight[] }) {
  if (highlights.length === 0) {
    return (
      <p className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        Clear week
      </p>
    )
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {highlights.slice(0, 3).map((highlight) => {
        const meta = KIND_META[highlight.kind]
        return (
          <span
            key={`${highlight.kind}-${highlight.label}`}
            className={cn(
              "inline-flex h-6 max-w-44 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
              meta.className
            )}
            title={highlight.label}
          >
            <meta.icon className="size-3 shrink-0" />
            <span className="truncate">{highlight.label}</span>
          </span>
        )
      })}
      {highlights.length > 3 ? (
        <span className="inline-flex h-6 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
          +{highlights.length - 3}
        </span>
      ) : null}
    </div>
  )
}
