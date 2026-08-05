import type { Metadata } from "next"
import { CalendarClockIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { LeaveTimeline } from "@/components/feature/leave-timeline"
import { TimeOffForm } from "@/components/feature/time-off-form"
import { TimeOffItem } from "@/components/feature/time-off-item"
import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from "@/lib/auth-guard"
import { getMembers } from "@/lib/services/members"
import { listAllTimeOff } from "@/lib/services/timeoff"
import { todayISO } from "@/lib/domain/date"

export const metadata: Metadata = {
  title: "Calendario",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function CalendarPage() {
  const userId = await requireAuth()
  const [members, entries] = await Promise.all([
    getMembers(userId),
    listAllTimeOff(userId),
  ])

  const today = todayISO()
  const upcoming = entries.filter((e) => e.startDate >= today)

  const memberById = new Map(members.map((member) => [member.id, member]))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Calendario"
        title="Calendario"
        description="El mes completo por persona — cada barra es una ausencia cargada."
      />

      <section aria-labelledby="calendar-timeline-heading">
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle id="calendar-timeline-heading">Ausencias del mes</AppleCardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Quién falta y cuándo, en una sola vista.
              </p>
            </div>
          </AppleCardHeader>
          <LeaveTimeline entries={entries} members={members} />
        </AppleCard>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="calendar-new-heading">
          <AppleCard>
            <AppleCardTitle id="calendar-new-heading">Cargar ausencia</AppleCardTitle>
            <TimeOffForm members={members} />
          </AppleCard>
        </section>

        <section aria-labelledby="calendar-upcoming-heading">
          <AppleCard>
            <AppleCardTitle id="calendar-upcoming-heading">Ausencias próximas</AppleCardTitle>
            {upcoming.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarClockIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin ausencias próximas</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <EmptyDescription>
                    Las ausencias que cargues aparecerán acá, listas para editar o eliminar.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((entry) => {
                  const member = memberById.get(entry.memberId)
                  if (!member) {
                    return null
                  }
                  return (
                    <TimeOffItem key={entry.id} entry={entry} member={member} members={members} />
                  )
                })}
              </ul>
            )}
          </AppleCard>
        </section>
      </div>
    </div>
  )
}
