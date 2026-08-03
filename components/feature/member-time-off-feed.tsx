import { CalendarDaysIcon } from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { TimeOffEntry, TimeOffType } from "@/lib/domain"

const TYPE_LABELS: Record<TimeOffType, string> = {
  vacation: "Vacation",
  license: "License",
  sickness: "Sickness",
  holiday: "Holiday",
}

const STATUS_CLASSES: Record<TimeOffEntry["status"], string> = {
  pending: "border-ok-amber/30 bg-ok-amber/10 text-ok-amber",
  approved: "border-ok-green/30 bg-ok-green/10 text-ok-green",
  rejected: "border-ok-red/30 bg-ok-red/10 text-ok-red",
}

function formatRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
  const startLabel = formatter.format(new Date(`${start}T00:00:00`))
  const endLabel = formatter.format(new Date(`${end}T00:00:00`))
  return start === end ? startLabel : `${startLabel} – ${endLabel}`
}

/** Persisted time-off feed for the member profile. */
export function MemberTimeOffFeed({ entries }: { entries: TimeOffEntry[] }) {
  return (
    <AppleCard>
      <AppleCardHeader>
        <div>
          <AppleCardTitle>Time off</AppleCardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved, pending and rejected requests for this member.
          </p>
        </div>
      </AppleCardHeader>

      {entries.length === 0 ? (
        <Empty className="py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDaysIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No time off recorded</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>Requests for this member will appear here.</EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{TYPE_LABELS[entry.type]}</p>
                <p className="text-sm text-muted-foreground">{formatRange(entry.startDate, entry.endDate)}</p>
                {entry.note ? (
                  <p className="mt-1 break-words text-xs text-muted-foreground">{entry.note}</p>
                ) : null}
              </div>
              <Badge variant="outline" className={STATUS_CLASSES[entry.status]}>
                {entry.status[0].toUpperCase() + entry.status.slice(1)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </AppleCard>
  )
}
