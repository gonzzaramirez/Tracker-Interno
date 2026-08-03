import { HistoryIcon } from "lucide-react"

import { SemaphorePill } from "@/components/feature/semaphore-pill"
import type { CheckIn } from "@/lib/domain"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/** Chronological check-in timeline with semaphore and optional notes. */
export function Timeline({ entries }: { entries: CheckIn[] }) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>No check-ins yet</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Completed check-ins will appear here with their status and notes.
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
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-card text-xs font-semibold text-foreground"
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{formatDate(entry.date)}</p>
              <SemaphorePill semaphore={entry.semaphore} />
            </div>
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
