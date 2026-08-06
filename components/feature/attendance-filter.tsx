"use client"

import { useRouter } from "next/navigation"
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addDays, isISODate, todayISO } from "@/lib/domain/date"

type AttendanceFilterProps = {
  /** The currently selected date (YYYY-MM-DD). */
  date: string
}

/**
 * Date filter for the attendance log. Defaults to today; lets the user step
 * back/forward one day at a time or pick any date. Navigates via ?date= so the
 * server component only loads the marks for the selected day.
 */
export function AttendanceFilter({ date }: AttendanceFilterProps) {
  const router = useRouter()
  const today = todayISO()

  function go(nextDate: string) {
    if (!isISODate(nextDate)) {
      return
    }
    if (nextDate === today) {
      router.push("/asistencias")
    } else {
      router.push(`/asistencias?date=${nextDate}`)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" aria-label="Día anterior" onClick={() => go(addDays(date, -1))}>
        <ChevronLeftIcon className="size-4" aria-hidden />
      </Button>

      <label className="inline-flex items-center gap-1.5">
        <CalendarDaysIcon className="size-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">Fecha</span>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(event) => go(event.target.value)}
          className="w-40"
        />
      </label>

      <Button type="button" variant="outline" size="icon" aria-label="Día siguiente" disabled={date >= today} onClick={() => go(addDays(date, 1))}>
        <ChevronRightIcon className="size-4" aria-hidden />
      </Button>

      {date !== today ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => go(today)}>
          Hoy
        </Button>
      ) : null}
    </div>
  )
}
