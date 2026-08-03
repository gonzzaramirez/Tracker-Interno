import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { TimeOffCalendar } from "@/components/feature/time-off-calendar"
import { TimeOffForm } from "@/components/feature/time-off-form"
import { TimeOffApproval } from "@/components/feature/time-off-approval"
import { WeekStaffing } from "@/components/feature/week-staffing"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getMembers } from "@/lib/services/members"
import {
  getPendingTimeOff,
  getTimeOffEntries,
  getUpcomingTimeOffEntries,
} from "@/lib/services/timeoff"
import type { TimeOffType } from "@/lib/domain"

export const metadata: Metadata = {
  title: "Calendar — Team Tracker",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TYPE_META: Record<TimeOffType, { label: string; className: string }> = {
  vacation: {
    label: "Vacation",
    className: "bg-timeoff-vacation/10 text-timeoff-vacation",
  },
  license: {
    label: "License",
    className: "bg-timeoff-license/10 text-timeoff-license",
  },
  sickness: {
    label: "Sickness",
    className: "bg-timeoff-sickness/10 text-timeoff-sickness",
  },
  holiday: {
    label: "Holiday",
    className: "bg-timeoff-holiday/10 text-timeoff-holiday",
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
  const [members, entries, upcoming, pending] = await Promise.all([
    getMembers(),
    getTimeOffEntries(),
    getUpcomingTimeOffEntries(),
    getPendingTimeOff(),
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

      <TimeOffApproval entries={pending} memberNames={memberNames} />

      <WeekStaffing members={members} entries={entries} />

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
                      <Badge
                        variant="outline"
                        className={
                          entry.status === "pending"
                            ? "border-ok-amber/30 bg-ok-amber/10 text-ok-amber"
                            : "border-ok-green/30 bg-ok-green/10 text-ok-green"
                        }
                      >
                        {entry.status === "pending" ? "Pending" : "Approved"}
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
