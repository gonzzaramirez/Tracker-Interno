"use client"

import { useMemo, useState, useTransition } from "react"
import {
  ChevronDownIcon,
  ClockIcon,
  ExternalLinkIcon,
  GaugeIcon,
  Loader2Icon,
  PauseIcon,
  RefreshCwIcon,
  TimerIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardDescription, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { TaskGoalForm } from "@/components/feature/task-goal-form"
import { TaskGoalList } from "@/components/feature/task-goal-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { syncTaskSheetAction } from "@/lib/actions/tasks"
import type { SheetResult, Task, TaskSheetMember, TaskDayStat } from "@/lib/domain"
import { goalRangeForType } from "@/lib/domain/goal"
import { todayISO } from "@/lib/domain/date"
import type { DayElapsed, TaskGoalView } from "@/lib/services/task-sheets"
import { cn } from "@/lib/utils"

type PeriodId = "daily" | "weekly" | "monthly" | "custom"

const PERIOD_TABS: Array<{ id: PeriodId; label: string }> = [
  { id: "daily", label: "Hoy" },
  { id: "weekly", label: "Esta semana" },
  { id: "monthly", label: "Este mes" },
  { id: "custom", label: "Personalizado" },
]

const RESULT_META: Record<SheetResult, { label: string; className: string }> = {
  done: { label: "Hechas", className: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300" },
  hard_match: { label: "Hard match", className: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" },
  soft_match: { label: "Soft match", className: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" },
  not_found: { label: "Not found", className: "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300" },
  other: { label: "Otros", className: "bg-muted text-muted-foreground" },
}

const RESULT_ORDER: SheetResult[] = ["done", "hard_match", "soft_match", "not_found", "other"]

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTimeOnly(isoString: string | null | undefined): string {
  if (!isoString) return "—"
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return isoString.slice(11, 16) || isoString
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return isoString.slice(11, 16) || isoString
  }
}

type TaskSheetDetailProps = {
  task: Task
  members: Array<TaskSheetMember & { memberName: string }>
  stats: Map<string, Map<string, Partial<Record<SheetResult, number>>>>
  elapsed: Map<string, Map<string, DayElapsed>>
  gaps: Map<string, Map<string, TaskDayStat>>
  goalViews: TaskGoalView[]
}

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Fecha corta es-AR ("7 ago") — usada para el rango personalizado. */
function formatShortDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  })
}

function emptyCounts(): Record<SheetResult, number> {
  return { done: 0, hard_match: 0, soft_match: 0, not_found: 0, other: 0 }
}

function MemberAvatar({ name, index }: { name: string; index: number }) {
  const PALETTE = ["#6366f1", "#0ea5e9", "#14b8a6", "#22c55e", "#eab308", "#f97316", "#ec4899", "#8b5cf6", "#f43f5e", "#3b82f6"]
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
      style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

export function TaskSheetDetail({ task, members, stats, elapsed, gaps, goalViews }: TaskSheetDetailProps) {
  const [period, setPeriod] = useState<PeriodId>("daily")
  const [isSyncing, startSync] = useTransition()
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)

  // Rango personalizado: defaults = mes actual (1º día → hoy), inicializados una sola vez.
  const [customStart, setCustomStart] = useState(() => `${todayISO().slice(0, 8)}01`)
  const [customEnd, setCustomEnd] = useState(() => todayISO())

  const range = useMemo(() => {
    if (period !== "custom") return goalRangeForType(period, todayISO())
    // Validaciones: si falta una fecha, colapsa al día de la otra; si start > end, se invierten.
    const fallbackStart = `${todayISO().slice(0, 8)}01`
    const fallbackEnd = todayISO()
    const start = customStart || customEnd || fallbackStart
    const end = customEnd || customStart || fallbackEnd
    return start <= end
      ? goalRangeForType("custom", todayISO(), { start, end })
      : goalRangeForType("custom", todayISO(), { start: end, end: start })
  }, [period, customStart, customEnd])

  function syncNow() {
    startSync(async () => {
      const result = await syncTaskSheetAction(task.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const sync = result.data
      if (sync.warning) {
        toast.warning(sync.warning)
      } else {
        toast.success(`Sincronización completada: ${sync.countedRows} tareas done de ${sync.totalRows} filas.`)
      }
      const unmatched = Object.keys(sync.unmatchedUsers)
      if (unmatched.length > 0) {
        toast.warning(
          `${unmatched.length} usuario(s) sin mapear: ${unmatched.slice(0, 5).join(", ")}${unmatched.length > 5 ? "…" : ""}`,
        )
      }
    })
  }

  const rows = useMemo(() => {
    const result: Array<{ date: string; memberId: string; counts: Record<SheetResult, number> }> = []
    for (const [memberId, byDate] of stats) {
      for (const [date, day] of byDate) {
        if (date >= range.startDate && date <= range.endDate) {
          result.push({ date, memberId, counts: { ...emptyCounts(), ...day } })
        }
      }
    }
    result.sort((a, b) => (a.date === b.date ? a.memberId.localeCompare(b.memberId) : b.date.localeCompare(a.date)))
    return result
  }, [stats, range])

  const memberTotals = useMemo(() => {
    const totals = new Map<string, Record<SheetResult, number>>()
    for (const row of rows) {
      let memberTotal = totals.get(row.memberId)
      if (!memberTotal) {
        memberTotal = emptyCounts()
        totals.set(row.memberId, memberTotal)
      }
      for (const result of RESULT_ORDER) {
        memberTotal[result] += row.counts[result]
      }
    }
    return totals
  }, [rows])

  const periodTotal = useMemo(
    () => [...memberTotals.values()].reduce((sum, counts) => sum + counts.done, 0),
    [memberTotals],
  )

  const formatRangeDate = (dateISO: string) => (period === "custom" ? formatShortDate(dateISO) : formatDate(dateISO))
  const periodLabel =
    range.startDate === range.endDate
      ? formatRangeDate(range.startDate)
      : `${formatRangeDate(range.startDate)} → ${formatRangeDate(range.endDate)}`

  // -- Tiempo (elapsed) summary -------------------------------------------------
  // -- Tiempo (elapsed) summary — solo días dentro del rango activo ------------
  const elapsedSummary = useMemo(() => {
    let totalAvg = 0
    let count = 0
    let fastest = Infinity
    let slowest = 0
    for (const [, byDate] of elapsed) {
      for (const [date, day] of byDate) {
        if (date < range.startDate || date > range.endDate) continue
        totalAvg += day.avgElapsedSeconds
        count += 1
        if (day.avgElapsedSeconds < fastest) fastest = day.avgElapsedSeconds
        if (day.avgElapsedSeconds > slowest) slowest = day.avgElapsedSeconds
      }
    }
    if (count === 0) return null
    return {
      avg: Math.round(totalAvg / count),
      fastest: fastest === Infinity ? 0 : fastest,
      slowest,
      totalDays: count,
    }
  }, [elapsed, range])

  const hasElapsedInPeriod = useMemo(() => {
    for (const row of rows) {
      const dayElapsed = elapsed.get(row.memberId)?.get(row.date)
      if (dayElapsed && dayElapsed.rowsWithElapsed > 0) return true
    }
    return false
  }, [rows, elapsed])

  // -- Gap (tiempo libre) summary -----------------------------------------------
  const gapSummary = useMemo(() => {
    let total = 0
    let max = 0
    let gapCount = 0
    let covStart: string | null = null
    let covEnd: string | null = null
    for (const [, byDate] of gaps) {
      for (const [date, stat] of byDate) {
        if (date >= range.startDate && date <= range.endDate && stat.gapCount && stat.gapCount > 0) {
          total += stat.totalGapSeconds ?? 0
          if ((stat.maxGapSeconds ?? 0) > max) max = stat.maxGapSeconds ?? 0
          gapCount += stat.gapCount ?? 0
          if (stat.coverageStart && (!covStart || stat.coverageStart < covStart)) covStart = stat.coverageStart
          if (stat.coverageEnd && (!covEnd || stat.coverageEnd > covEnd)) covEnd = stat.coverageEnd
        }
      }
    }
    if (gapCount === 0) return null
    return { total, max, gapCount, avg: Math.round(total / gapCount), coverageStart: covStart, coverageEnd: covEnd }
  }, [gaps, range])

  // -- Accordion: general stats per member for the current period ---------------
  // Days with data for each member within the period, newest first.
  const memberDays = useMemo(() => {
    const byMember = new Map<string, Array<{ date: string; counts: Record<SheetResult, number> }>>()
    for (const [memberId, byDate] of stats) {
      const days: Array<{ date: string; counts: Record<SheetResult, number> }> = []
      for (const [date, day] of byDate) {
        if (date >= range.startDate && date <= range.endDate) {
          days.push({ date, counts: { ...emptyCounts(), ...day } })
        }
      }
      days.sort((a, b) => b.date.localeCompare(a.date))
      byMember.set(memberId, days)
    }
    return byMember
  }, [stats, range])

  type MemberStatSummary = {
    counts: Record<SheetResult, number>
    avgElapsed: number
    fastest: number
    slowest: number
    timeCount: number
    totalGap: number
    maxGap: number
    avgGap: number
    gapCount: number
    coverageStart: string | null
    coverageEnd: string | null
  }

  // Aggregated stats for the expanded member across the whole period.
  const expandedMemberStats = useMemo<MemberStatSummary | null>(() => {
    if (!expandedMemberId) return null
    const days = memberDays.get(expandedMemberId) ?? []
    const counts = emptyCounts()
    let avgSum = 0
    let timeCount = 0
    let fastest = Infinity
    let slowest = 0
    let totalGap = 0
    let maxGap = 0
    let gapCount = 0
    let covStart: string | null = null
    let covEnd: string | null = null
    for (const day of days) {
      for (const result of RESULT_ORDER) counts[result] += day.counts[result]
      const dayElapsed = elapsed.get(expandedMemberId)?.get(day.date)
      if (dayElapsed && dayElapsed.rowsWithElapsed > 0) {
        avgSum += dayElapsed.avgElapsedSeconds
        timeCount += 1
        if (dayElapsed.minElapsedSeconds < fastest) fastest = dayElapsed.minElapsedSeconds
        if (dayElapsed.maxElapsedSeconds > slowest) slowest = dayElapsed.maxElapsedSeconds
      }
      const dayGap = gaps.get(expandedMemberId)?.get(day.date)
      if (dayGap && dayGap.gapCount && dayGap.gapCount > 0) {
        totalGap += dayGap.totalGapSeconds ?? 0
        gapCount += dayGap.gapCount
        if ((dayGap.maxGapSeconds ?? 0) > maxGap) maxGap = dayGap.maxGapSeconds ?? 0
        if (dayGap.coverageStart && (!covStart || dayGap.coverageStart < covStart)) covStart = dayGap.coverageStart
        if (dayGap.coverageEnd && (!covEnd || dayGap.coverageEnd > covEnd)) covEnd = dayGap.coverageEnd
      }
    }
    return {
      counts,
      avgElapsed: timeCount > 0 ? Math.round(avgSum / timeCount) : 0,
      fastest: fastest === Infinity ? 0 : fastest,
      slowest,
      timeCount,
      totalGap,
      maxGap,
      avgGap: gapCount > 0 ? Math.round(totalGap / gapCount) : 0,
      gapCount,
      coverageStart: covStart,
      coverageEnd: covEnd,
    }
  }, [expandedMemberId, memberDays, elapsed, gaps])

  // -- Goal form (shared component; task is fixed to this task) ---------------
  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <AppleCard>
        <AppleCardHeader>
          <div className="min-w-0">
            <AppleCardTitle>{task.title}</AppleCardTitle>
            <AppleCardDescription>
              {task.description ? <span className="block">{task.description}</span> : null}
              <span className="mt-1 inline-flex items-center gap-1.5">
                <RefreshCwIcon className="size-3.5" aria-hidden />
                {task.lastSyncedAt
                  ? `Última sincronización ${new Date(task.lastSyncedAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "Sin sincronizar"}
                {" · "}
                <a
                  href={task.sheetUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                >
                  Ver planilla <ExternalLinkIcon className="size-3" aria-hidden />
                </a>
              </span>
            </AppleCardDescription>
          </div>
          <Button type="button" variant="outline" onClick={syncNow} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <RefreshCwIcon className="size-4" aria-hidden />
            )}
            Sincronizar ahora
          </Button>
        </AppleCardHeader>

        {task.lastSyncError ? (
          <Alert variant="destructive">
            <TriangleAlertIcon className="size-4" aria-hidden />
            <AlertTitle>Error de sincronización</AlertTitle>
            <AlertDescription>{task.lastSyncError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Período" className="flex w-fit gap-1 rounded-full bg-muted/40 p-1">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={period === tab.id}
                onClick={() => setPeriod(tab.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  period === tab.id && "bg-background text-foreground shadow-sm",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-xl font-semibold tabular-nums text-foreground">{periodTotal}</span>{" "}
            tareas done · {periodLabel}
          </p>
        </div>

        {period === "custom" ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-foreground/5 pt-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-range-start">Desde</Label>
              <Input
                id="custom-range-start"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-range-end">Hasta</Label>
              <Input
                id="custom-range-end"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="w-40"
              />
            </div>
          </div>
        ) : null}
      </AppleCard>

      {/* ===== Time summary ===== */}
      {elapsedSummary ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle className="flex items-center gap-2">
                <TimerIcon className="size-4" aria-hidden />
                Resumen de tiempo
              </AppleCardTitle>
              <AppleCardDescription>
                Basado en {elapsedSummary.totalDays} día(s) con datos de tiempo.
              </AppleCardDescription>
            </div>
          </AppleCardHeader>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-muted/40 p-3">
              <GaugeIcon className="mx-auto size-4 text-muted-foreground" aria-hidden />
              <p className="mt-1 text-xs text-muted-foreground">Promedio</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(elapsedSummary.avg)}</p>
            </div>
            <div className="rounded-xl bg-green-500/10 p-3">
              <ClockIcon className="mx-auto size-4 text-green-600 dark:text-green-400" aria-hidden />
              <p className="mt-1 text-xs text-muted-foreground">Más rápido</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(elapsedSummary.fastest)}</p>
            </div>
            <div className="rounded-xl bg-red-500/10 p-3">
              <ClockIcon className="mx-auto size-4 text-red-600 dark:text-red-400" aria-hidden />
              <p className="mt-1 text-xs text-muted-foreground">Más lento</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(elapsedSummary.slowest)}</p>
            </div>
          </div>
        </AppleCard>
      ) : null}

      {/* ===== Gap card ===== */}
      {gapSummary ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle className="flex items-center gap-2">
                <PauseIcon className="size-4" aria-hidden />
                Tiempo libre entre tareas
              </AppleCardTitle>
              <AppleCardDescription>
                {gapSummary.gapCount} pausa(s) encontrada(s) en el período.
              </AppleCardDescription>
            </div>
          </AppleCardHeader>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatHours(gapSummary.total)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Promedio</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(gapSummary.avg)}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <p className="text-xs text-muted-foreground">Más largo</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(gapSummary.max)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Cobertura</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {gapSummary.coverageStart && gapSummary.coverageEnd
                  ? `${formatTimeOnly(gapSummary.coverageStart)} → ${formatTimeOnly(gapSummary.coverageEnd)}`
                  : "—"}
              </p>
            </div>
          </div>
        </AppleCard>
      ) : null}

      {/* ===== Per-member (with accordion) ===== */}
      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Por miembro</AppleCardTitle>
            <AppleCardDescription>
              Tareas done y desglose por resultado en {periodLabel.toLowerCase()}.
            </AppleCardDescription>
          </div>
        </AppleCardHeader>

        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Esta tarea no tiene miembros vinculados a la planilla.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {members.map((member, index) => {
              const totals = memberTotals.get(member.memberId) ?? emptyCounts()
              const isExpanded = expandedMemberId === member.memberId
              const days = isExpanded ? (memberDays.get(member.memberId) ?? []) : []
              const memberStats = isExpanded ? expandedMemberStats : null

              return (
                <li key={member.memberId}>
                  {/* Member summary row — clickable */}
                  <button
                    type="button"
                    onClick={() => setExpandedMemberId(isExpanded ? null : member.memberId)}
                    aria-expanded={isExpanded}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-2 py-3 text-left transition-colors hover:bg-muted/30 sm:px-3"
                  >
                    <MemberAvatar name={member.memberName} index={index} />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-semibold text-foreground">{member.memberName}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.sheetUser}</p>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums text-foreground" aria-label={`${totals.done} tareas done`}>
                      {totals.done}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {RESULT_ORDER.slice(1).map((result) => (
                        <span key={result} className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", RESULT_META[result].className)}>
                          {RESULT_META[result].label} {totals[result]}
                        </span>
                      ))}
                    </div>
                    <ChevronDownIcon
                      className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                      aria-hidden
                    />
                  </button>

                  {/* Expanded detail — general stats for the member in this period */}
                  {isExpanded && memberStats ? (
                    <div className="overflow-hidden px-2 pb-4 sm:px-3">
                      {/* Compact summary chips */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">Tareas done</p>
                          <p className="text-lg font-semibold tabular-nums text-foreground">{memberStats.counts.done}</p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">Desglose</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {RESULT_ORDER.slice(1).map((result) => (
                              <span
                                key={result}
                                className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums", RESULT_META[result].className)}
                              >
                                {RESULT_META[result].label} {memberStats.counts[result]}
                              </span>
                            ))}
                          </div>
                        </div>
                        {memberStats.timeCount > 0 ? (
                          <>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                              <p className="text-lg font-semibold tabular-nums text-foreground">{formatElapsed(memberStats.avgElapsed)}</p>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Más rápido / más lento</p>
                              <p className="text-sm font-semibold tabular-nums text-foreground">
                                {formatElapsed(memberStats.fastest)} / {formatElapsed(memberStats.slowest)}
                              </p>
                            </div>
                          </>
                        ) : null}
                        {memberStats.gapCount > 0 ? (
                          <>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Tiempo libre total</p>
                              <p className="text-lg font-semibold tabular-nums text-foreground">{formatHours(memberStats.totalGap)}</p>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Gap promedio / más largo</p>
                              <p className="text-sm font-semibold tabular-nums text-foreground">
                                {formatElapsed(memberStats.avgGap)} / {formatElapsed(memberStats.maxGap)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Cobertura</p>
                              <p className="text-sm font-semibold tabular-nums text-foreground">
                                {memberStats.coverageStart && memberStats.coverageEnd
                                  ? `${formatTimeOnly(memberStats.coverageStart)} → ${formatTimeOnly(memberStats.coverageEnd)}`
                                  : "—"}
                              </p>
                            </div>
                          </>
                        ) : null}
                      </div>

                      {/* Per-day breakdown */}
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Desglose por día</p>
                        {days.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">Sin registros en este período.</p>
                        ) : (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-foreground/10 text-left text-muted-foreground">
                                  <th className="pb-1.5 pr-3 font-medium">Fecha</th>
                                  <th className="pb-1.5 pr-3 font-medium">Done</th>
                                  <th className="pb-1.5 pr-3 font-medium">Hard</th>
                                  <th className="pb-1.5 pr-3 font-medium">Soft</th>
                                  <th className="pb-1.5 pr-3 font-medium">Not found</th>
                                  <th className="pb-1.5 pr-3 font-medium">Otros</th>
                                  <th className="pb-1.5 pr-3 font-medium">Promedio</th>
                                  <th className="pb-1.5 font-medium">Tiempo libre</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-foreground/5">
                                {days.map((day) => {
                                  const dayElapsed = elapsed.get(member.memberId)?.get(day.date)
                                  const dayGap = gaps.get(member.memberId)?.get(day.date)
                                  return (
                                    <tr key={day.date} className="text-foreground">
                                      <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(day.date)}</td>
                                      <td className="py-1.5 pr-3 tabular-nums font-semibold">{day.counts.done}</td>
                                      <td className="py-1.5 pr-3 tabular-nums">{day.counts.hard_match}</td>
                                      <td className="py-1.5 pr-3 tabular-nums">{day.counts.soft_match}</td>
                                      <td className="py-1.5 pr-3 tabular-nums">{day.counts.not_found}</td>
                                      <td className="py-1.5 pr-3 tabular-nums">{day.counts.other}</td>
                                      <td className="py-1.5 pr-3 tabular-nums">
                                        {dayElapsed && dayElapsed.rowsWithElapsed > 0 ? formatElapsed(dayElapsed.avgElapsedSeconds) : "—"}
                                      </td>
                                      <td className="py-1.5 tabular-nums">
                                        {dayGap && dayGap.gapCount && dayGap.gapCount > 0 ? formatElapsed(dayGap.totalGapSeconds ?? 0) : "—"}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </AppleCard>

      {/* ===== Per-day (only when period is not daily — avoids duplication) ===== */}
      {period !== "daily" && rows.length > 0 ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Por día</AppleCardTitle>
              <AppleCardDescription>El detalle diario dentro del período.</AppleCardDescription>
            </div>
          </AppleCardHeader>
          <ul className="divide-y divide-foreground/5">
            {rows.map((row) => {
              const member = members.find((m) => m.memberId === row.memberId)
              const dayElapsed = hasElapsedInPeriod ? elapsed.get(row.memberId)?.get(row.date) : undefined
              return (
                <li key={`${row.date}-${row.memberId}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 py-3 sm:px-3">
                  <span className="w-24 shrink-0 text-sm tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member?.memberName ?? "Miembro eliminado"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{row.counts.done}</p>
                  {hasElapsedInPeriod ? (
                    <p className="w-28 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {dayElapsed && dayElapsed.rowsWithElapsed > 0 ? (
                        <span className="inline-flex items-center gap-1" title={`${dayElapsed.rowsWithElapsed} filas con tiempo · promedio ${dayElapsed.avgElapsedSeconds}s`}>
                          <TimerIcon className="size-3" aria-hidden />
                          {formatElapsed(dayElapsed.avgElapsedSeconds)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {RESULT_ORDER.slice(1).map((result) => (
                      <span key={result} className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", RESULT_META[result].className)}>
                        {row.counts[result]}
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </AppleCard>
      ) : null}

      {/* ===== Objetivos (embedded) ===== */}
      <section aria-labelledby="task-goals-heading" className="space-y-4">
        <div>
          <h2 id="task-goals-heading" className="text-base font-semibold tracking-tight text-foreground">
            Objetivos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Metas sobre las tareas importadas — el progreso se actualiza con cada sincronización.
          </p>
        </div>

        {/* New goal form (shared, task fijada a esta tarea) */}
        <TaskGoalForm tasks={[task]} defaultTaskId={task.id} collapsible title="Nuevo objetivo" />

        {/* Goals list (agrupada por período, acciones de archivo incluidas) */}
        <TaskGoalList views={goalViews} showTaskHeader={false} />
      </section>
    </div>
  )
}
