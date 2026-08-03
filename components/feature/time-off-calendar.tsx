"use client"

import { useMemo, useState } from "react"
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

  function DayButton(props: DayButtonProps) {
    const { day, ...rest } = props
    const approved = approvedByDate[day.isoDate] ?? []
    const pending = pendingByDate[day.isoDate] ?? []
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
        className={cn(rest.className, "relative cursor-default")}
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

  return (
    <div className="overflow-x-auto">
      <DayPicker
        classNames={classNames}
        components={{ DayButton }}
        month={month}
        onMonthChange={setMonth}
        showOutsideDays={false}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Solid dots mark approved time off. Dashed markers are pending requests.
      </p>
    </div>
  )
}
