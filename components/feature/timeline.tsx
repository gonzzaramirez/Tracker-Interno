import { HistoryIcon } from "lucide-react"

import type { TimelineEntry } from "@/lib/domain"
import { Progress } from "@/components/ui/progress"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * Chronological follow-up timeline (REQ-MF-003): each record shows the date,
 * linked task title, progress value (0-100) and optional note.
 */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>No follow-ups yet</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Progress records will show up here as follow-ups are logged.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <ol className="relative space-y-4">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-4">
          {index < entries.length - 1 ? (
            <span
              className="absolute top-9 left-4 h-[calc(100%-1.5rem)] w-px bg-foreground/10"
              aria-hidden
            />
          ) : null}
          <span
            className="size-8 shrink-0 rounded-full border border-foreground/10 bg-card text-xs font-semibold tabular-nums"
            role="img"
            aria-label={`${entry.value} percent on ${entry.date}`}
          >
            <span className="flex size-full items-center justify-center rounded-full bg-muted/60 text-foreground">
              {entry.value}
            </span>
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.taskTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <p className="text-xs font-medium tabular-nums text-muted-foreground">
                {entry.value}%
              </p>
            </div>
            <Progress value={entry.value} aria-label={`Progress on ${entry.taskTitle}`} />
            {entry.note ? (
              <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {entry.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
