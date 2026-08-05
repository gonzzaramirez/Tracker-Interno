"use client"

import { useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/domain/date"
import type { Member, TimeOffEntry, TimeOffType } from "@/lib/domain"

const TYPE_META: Record<TimeOffType, { label: string; bar: string; dot: string }> = {
  vacation: {
    label: "Vacaciones",
    bar: "border-timeoff-vacation/40 bg-timeoff-vacation/15 text-timeoff-vacation",
    dot: "bg-timeoff-vacation",
  },
  license: {
    label: "Licencia",
    bar: "border-timeoff-license/50 bg-timeoff-license/15 text-timeoff-license",
    dot: "bg-timeoff-license",
  },
  sickness: {
    label: "Enfermedad",
    bar: "border-timeoff-sickness/50 bg-timeoff-sickness/15 text-timeoff-sickness",
    dot: "bg-timeoff-sickness",
  },
  holiday: {
    label: "Feriado",
    bar: "border-timeoff-holiday/50 bg-timeoff-holiday/15 text-timeoff-holiday",
    dot: "bg-timeoff-holiday",
  },
}

const DAY_WIDTH_REM = 2.25
const MEMBER_COL_REM = 11
const BAR_HEIGHT_REM = 1.375
const BAR_GAP_REM = 0.25

type TimelineDay = {
  iso: string
  dayNumber: number
  weekday: string
  isWeekend: boolean
  isToday: boolean
}

type VisibleEntry = {
  entry: TimeOffEntry
  /** 1-based day of month where the visible segment starts. */
  startDay: number
  /** 1-based day of month where the visible segment ends. */
  endDay: number
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function formatRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
  return `${fmt.format(new Date(`${start}T00:00:00`))} – ${fmt.format(new Date(`${end}T00:00:00`))}`
}

/**
 * Resource-timeline leave calendar: members as rows, days of the month as
 * columns, and each absence as a continuous bar across its date range.
 */
export function LeaveTimeline({
  entries,
  members,
}: {
  entries: TimeOffEntry[]
  members: Member[]
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const today = todayISO()
  const monthStartIso = `${year}-${pad2(monthIndex + 1)}-01`
  const monthEndIso = `${year}-${pad2(monthIndex + 1)}-${pad2(daysInMonth)}`

  const days = useMemo<TimelineDay[]>(() => {
    const weekdayFmt = new Intl.DateTimeFormat("es-AR", { weekday: "narrow" })
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, monthIndex, i + 1)
      const iso = `${year}-${pad2(monthIndex + 1)}-${pad2(i + 1)}`
      const weekday = date.getDay()
      return {
        iso,
        dayNumber: i + 1,
        weekday: weekdayFmt.format(date),
        isWeekend: weekday === 0 || weekday === 6,
        isToday: iso === today,
      }
    })
  }, [year, monthIndex, daysInMonth, today])

  const entriesByMember = useMemo(() => {
    const map = new Map<string, VisibleEntry[]>()
    for (const member of members) {
      const visible = entries
        .filter(
          (entry) =>
            entry.memberId === member.id &&
            entry.startDate <= monthEndIso &&
            entry.endDate >= monthStartIso,
        )
        .map((entry) => ({
          entry,
          startDay: entry.startDate < monthStartIso ? 1 : Number(entry.startDate.slice(8, 10)),
          endDay: entry.endDate > monthEndIso ? daysInMonth : Number(entry.endDate.slice(8, 10)),
        }))
        .sort((a, b) => a.startDay - b.startDay)
      map.set(member.id, visible)
    }
    return map
  }, [entries, members, monthStartIso, monthEndIso, daysInMonth])

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    month,
  )
  const trackMinWidth = `${daysInMonth * DAY_WIDTH_REM}rem`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-foreground capitalize">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date()
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronRightIcon className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/5">
        <div style={{ minWidth: `calc(${MEMBER_COL_REM}rem + ${trackMinWidth})` }}>
          {/* Header: day numbers */}
          <div className="flex border-b border-foreground/5 bg-muted/30">
            <div
              className="sticky left-0 z-10 shrink-0 bg-muted/30 px-3 py-2 backdrop-blur-sm"
              style={{ width: `${MEMBER_COL_REM}rem` }}
            >
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Miembro
              </span>
            </div>
            <div className="flex flex-1" style={{ minWidth: trackMinWidth }}>
              {days.map((day) => (
                <div
                  key={day.iso}
                  className={cn(
                    "flex flex-1 flex-col items-center py-1 text-[10px] leading-tight",
                    day.isWeekend && "bg-foreground/[0.03] text-muted-foreground/70",
                    day.isToday && "bg-blue-500/10",
                  )}
                >
                  <span className="font-medium text-muted-foreground">{day.weekday}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      day.isToday
                        ? "flex size-5 items-center justify-center rounded-full bg-blue-500 font-semibold text-white"
                        : "text-muted-foreground",
                    )}
                  >
                    {day.dayNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Member rows */}
          {members.map((member) => {
            const visible = entriesByMember.get(member.id) ?? []
            const laneHeight = BAR_HEIGHT_REM + BAR_GAP_REM
            const rowHeight = Math.max(3.25, visible.length * laneHeight + 0.75)
            return (
              <div
                key={member.id}
                className="flex border-b border-foreground/5 last:border-b-0"
                style={{ minHeight: `${rowHeight}rem` }}
              >
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-foreground/5 bg-card px-3 py-2"
                  style={{ width: `${MEMBER_COL_REM}rem` }}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                    style={member.displayColor ? { backgroundColor: member.displayColor } : undefined}
                    aria-hidden
                  >
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                <div className="relative flex-1" style={{ minWidth: trackMinWidth }}>
                  {/* Day grid background */}
                  <div className="absolute inset-0 flex" aria-hidden>
                    {days.map((day) => (
                      <div
                        key={day.iso}
                        className={cn(
                          "flex-1 border-l border-foreground/5 first:border-l-0",
                          day.isWeekend && "bg-foreground/[0.03]",
                          day.isToday && "bg-blue-500/10",
                        )}
                      />
                    ))}
                  </div>

                  {/* Leave bars */}
                  {visible.map(({ entry, startDay, endDay }, lane) => {
                    const meta = TYPE_META[entry.type]
                    const pending = entry.status === "pending"
                    return (
                      <div
                        key={entry.id}
                        title={`${member.name} — ${meta.label}${pending ? " (pendiente)" : ""} · ${formatRange(entry.startDate, entry.endDate)}`}
                        className={cn(
                          "absolute flex items-center overflow-hidden rounded-md border px-1.5 text-[10px] font-medium whitespace-nowrap",
                          meta.bar,
                          pending && "border-dashed opacity-70",
                        )}
                        style={{
                          left: `${((startDay - 1) / daysInMonth) * 100}%`,
                          width: `${((endDay - startDay + 1) / daysInMonth) * 100}%`,
                          top: `${0.5 + lane * laneHeight}rem`,
                          height: `${BAR_HEIGHT_REM}rem`,
                        }}
                      >
                        <span className="truncate">{meta.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <li key={type} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
            {meta.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-sm border border-dashed border-ok-amber bg-ok-amber/10"
            aria-hidden
          />
          Pendiente de aprobación
        </li>
      </ul>
    </div>
  )
}
