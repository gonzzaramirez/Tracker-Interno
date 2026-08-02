import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { TimeOffCalendar } from "@/components/feature/time-off-calendar"
import { TimeOffForm } from "@/components/feature/time-off-form"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getMembers } from "@/lib/services/members"
import { getTimeOffEntries, getUpcomingTimeOffEntries } from "@/lib/services/calendar"
import type { TimeOffType } from "@/lib/domain"

export const metadata: Metadata = {
  title: "Calendar — Team Tracker",
}

const TYPE_META: Record<TimeOffType, { label: string; className: string }> = {
  vacation: {
    label: "Vacation",
    className: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  },
  recess: {
    label: "Recovery",
    className: "bg-teal-500/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
  },
  other: {
    label: "Other",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
}

function formatRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const startLabel = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const endLabel = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return start === end ? startLabel : `${startLabel} – ${endLabel}`
}

export default async function CalendarPage() {
  const [members, entries, upcoming] = await Promise.all([
    getMembers(),
    getTimeOffEntries(),
    getUpcomingTimeOffEntries(),
  ])

  const memberNames = Object.fromEntries(members.map((member) => [member.id, member.name]))
  const nameOf = (id: string) => memberNames[id] ?? "Unknown"

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title="Calendar"
        description="Who's away and when — plan coverage before it matters."
      />

      <section aria-labelledby="calendar-view-heading" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <AppleCard>
          <AppleCardTitle id="calendar-view-heading">Time off</AppleCardTitle>
          <TimeOffCalendar entries={entries} memberNames={memberNames} />
        </AppleCard>

        <AppleCard className="lg:sticky lg:top-24">
          <AppleCardTitle>Request time off</AppleCardTitle>
          <TimeOffForm members={members} />
        </AppleCard>
      </section>

      <section aria-labelledby="calendar-upcoming-heading">
        <AppleCard>
          <AppleCardTitle id="calendar-upcoming-heading">Upcoming time off</AppleCardTitle>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming time off booked.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((entry) => {
                const meta = TYPE_META[entry.type]
                return (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{nameOf(entry.memberId)}</p>
                      {entry.note ? (
                        <p className="text-xs truncate text-muted-foreground">{entry.note}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("border-transparent", meta.className)}>
                        {meta.label}
                      </Badge>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatRange(entry.startDate, entry.endDate)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </AppleCard>
      </section>
    </div>
  )
}