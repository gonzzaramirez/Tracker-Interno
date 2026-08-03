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

/**
 * Read-only team calendar (task 7.3): one dot per member on days covered by a
 * time-off entry (REQ-TO-001). Built on react-day-picker v10 with a custom
 * DayButton that keeps default styling.
 */
export function TimeOffCalendar({ entries, memberNames }: TimeOffCalendarProps) {
  const classNames = getDefaultClassNames()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const byDate = useMemo(() => indexTimeOffByDate(entries), [entries])

  function DayButton(props: DayButtonProps) {
    const { day, ...rest } = props
    const covered = byDate[day.isoDate] ?? []
    const names = covered.map((entry) => memberNames[entry.memberId] ?? "Unknown")

    return (
      <button
        {...rest}
        className={cn(rest.className, "relative cursor-default")}
        {...(names.length > 0 ? { title: `${day.isoDate} — ${names.join(", ")} off` } : {})}
      >
        {day.date.getDate()}
        {covered.length > 0 ? (
          <span className="pointer-events-none absolute right-1 bottom-0.5 flex gap-0.5">
            {names.slice(0, 3).map((name, index) => (
              <span
                key={name}
                className={cn(
                  "size-1.5 rounded-full",
                  index === 0 ? "bg-blue-500" : index === 1 ? "bg-teal-500" : "bg-amber-500"
                )}
              />
            ))}
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
        Dots mark time off. Hover a day for names.
      </p>
    </div>
  )
}
