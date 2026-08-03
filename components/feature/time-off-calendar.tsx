"use client"

import { endOfWeek, startOfWeek } from "date-fns"
import { createContext, useContext, useMemo, useState } from "react"
import { DayPicker, getDefaultClassNames, type DayButtonProps } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { indexTimeOffByDate } from "@/lib/domain/date"
import type { TimeOffEntry } from "@/lib/domain"

type TimeOffCalendarProps = {
  entries: TimeOffEntry[]
  memberNames: Record<string, string>
}

const TYPE_DOT_CLASSES: Record<TimeOffEntry["type"], string> = {
  vacation: "bg-timeoff-vacation",
  license: "bg-timeoff-license",
  sickness: "bg-timeoff-sickness",
  holiday: "bg-timeoff-holiday",
}

type CalendarDayContext = {
  approvedByDate: Record<string, TimeOffEntry[]>
  pendingByDate: Record<string, TimeOffEntry[]>
  memberNames: Record<string, string>
}

const CalendarDayContext = createContext<CalendarDayContext | null>(null)

function isCurrentWeek(date: Date): boolean {
  const now = new Date()
  return (
    date >= startOfWeek(now, { weekStartsOn: 1 }) &&
    date <= endOfWeek(now, { weekStartsOn: 1 })
  )
}

/** Stable module-scope DayPicker v10 button; data arrives through context. */
function CalendarDayButton(props: DayButtonProps) {
  const { day, ...rest } = props
  const context = useContext(CalendarDayContext)
  const approved = context?.approvedByDate[day.isoDate] ?? []
  const pending = context?.pendingByDate[day.isoDate] ?? []
  const memberNames = context?.memberNames ?? {}
  const approvedNames = approved.map((entry) => memberNames[entry.memberId] ?? "Unknown")
  const pendingNames = pending.map((entry) => memberNames[entry.memberId] ?? "Unknown")
  const title = [
    approvedNames.length > 0 ? `Approved: ${approvedNames.join(", ")}` : "",
    pendingNames.length > 0 ? `Pending: ${pendingNames.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <button
      {...rest}
      className={cn(
        rest.className,
        "relative cursor-default",
        isCurrentWeek(day.date) && "ring-1 ring-inset ring-blue-500/25",
      )}
      {...(title ? { title: `${day.isoDate} — ${title}` } : {})}
    >
      {day.date.getDate()}
      {approved.length > 0 || pending.length > 0 ? (
        <span className="pointer-events-none absolute right-1 bottom-0.5 flex gap-0.5">
          {approved.slice(0, 3).map((entry) => (
            <span
              key={`${entry.id}-${day.isoDate}`}
              className={cn("size-1.5 rounded-full", TYPE_DOT_CLASSES[entry.type])}
              aria-hidden
            />
          ))}
          {pending.length > 0 ? (
            <span
              className="size-1.5 rounded-sm border border-dashed border-ok-amber bg-ok-amber/10"
              aria-hidden
            />
          ) : null}
        </span>
      ) : null}
    </button>
  )
}

/** Monthly calendar with approved dots and separate pending markers. */
export function TimeOffCalendar({ entries, memberNames }: TimeOffCalendarProps) {
  const classNames = getDefaultClassNames()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const approvedByDate = useMemo(
    () => indexTimeOffByDate(entries.filter((entry) => entry.status === "approved")),
    [entries],
  )
  const pendingByDate = useMemo(
    () => indexTimeOffByDate(entries.filter((entry) => entry.status === "pending")),
    [entries],
  )
  const calendarData = useMemo(
    () => ({ approvedByDate, pendingByDate, memberNames }),
    [approvedByDate, pendingByDate, memberNames],
  )

  return (
    <CalendarDayContext.Provider value={calendarData}>
      <div className="overflow-x-auto">
        <DayPicker
          classNames={classNames}
          components={{ DayButton: CalendarDayButton }}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays={false}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Solid dots mark approved time off. Dashed markers are pending requests.
        </p>
      </div>
    </CalendarDayContext.Provider>
  )
}
