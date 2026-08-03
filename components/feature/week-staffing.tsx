import { startOfWeek } from "date-fns"
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
import type { Member, TimeOffEntry, TimeOffType } from "@/lib/domain"
import { addDays, isoDate } from "@/lib/domain/date"

const TYPE_META: Record<TimeOffType, { label: string; className: string }> = {
  vacation: {
    label: "Vacaciones",
    className: "bg-timeoff-vacation/10 text-timeoff-vacation",
  },
  license: {
    label: "Licencia",
    className: "bg-timeoff-license/10 text-timeoff-license",
  },
  sickness: {
    label: "Enfermedad",
    className: "bg-timeoff-sickness/10 text-timeoff-sickness",
  },
  holiday: {
    label: "Feriado",
    className: "bg-timeoff-holiday/10 text-timeoff-holiday",
  },
}

function weekDates(): string[] {
  const monday = isoDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

function formatDay(dateISO: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateISO}T00:00:00`))
}

function coversDate(entry: TimeOffEntry, date: string): boolean {
  return entry.status === "approved" && entry.startDate <= date && entry.endDate >= date
}

/** Current-week approved absence and active-member availability read model. */
export function WeekStaffing({
  members,
  entries,
}: {
  members: Member[]
  entries: TimeOffEntry[]
}) {
  const activeMembers = members.filter((member) => member.status === "active")
  const dates = weekDates()

  if (activeMembers.length === 0) {
    return (
      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Ausentes / Disponibles</AppleCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Personal de la semana actual.</p>
          </div>
        </AppleCardHeader>
        <Empty className="py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDaysIcon />
            </EmptyMedia>
            <EmptyTitle>Sin miembros activos</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>Los miembros activos aparecerán acá cuando estén disponibles.</EmptyDescription>
          </EmptyContent>
        </Empty>
      </AppleCard>
    )
  }

  return (
    <AppleCard>
      <AppleCardHeader>
        <div>
          <AppleCardTitle>Ausentes / Disponibles</AppleCardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo ausencias aprobadas — las solicitudes pendientes no cambian la cobertura.
          </p>
        </div>
      </AppleCardHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dates.map((date) => {
          const absentEntries = entries.filter((entry) => coversDate(entry, date))
          const absentIds = new Set(absentEntries.map((entry) => entry.memberId))
          const availableMembers = activeMembers.filter((member) => !absentIds.has(member.id))

          return (
            <article key={date} className="rounded-2xl bg-muted/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">{formatDay(date)}</h3>
              <div className="mt-4 space-y-4">
                <section aria-label={`Who’s out on ${formatDay(date)}`}>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Who’s out</p>
                  {absentEntries.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Sin ausencias aprobadas</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {absentEntries.map((entry) => {
                        const member = members.find((item) => item.id === entry.memberId)
                        const type = TYPE_META[entry.type]
                        return (
                          <li key={`${entry.id}-${date}`} className="flex items-center gap-2 text-sm">
                            <span className="size-2 rounded-full bg-ok-amber" aria-hidden />
                            <span className="min-w-0 truncate text-foreground">{member?.name ?? "Miembro desconocido"}</span>
                            <Badge variant="outline" className={`ml-auto border-transparent ${type.className}`}>
                              {type.label}
                            </Badge>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>

                <section aria-label={`Who’s available on ${formatDay(date)}`}>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Who’s available</p>
                  {availableMembers.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Sin miembros activos disponibles</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {availableMembers.map((member) => (
                        <li key={`${member.id}-${date}`} className="truncate text-sm text-foreground">
                          {member.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </article>
          )
        })}
      </div>
    </AppleCard>
  )
}
