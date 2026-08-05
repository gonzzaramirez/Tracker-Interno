import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import type { Member } from "@/lib/domain"
import { StatusBadge } from "@/components/feature/status-badge"
import { Sparkline } from "@/components/feature/sparkline"
import { StarRating } from "@/components/feature/star-rating"
import { cn } from "@/lib/utils"

function TrendDelta({ trend }: { trend: number | null }) {
  if (trend === null || trend === 0) {
    return (
      <span className="text-xs tabular-nums text-muted-foreground">
        Sin cambio reciente
      </span>
    )
  }
  const positive = trend > 0
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        positive ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300",
      )}
    >
      {positive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}
    </span>
  )
}

type MemberTrendRowProps = {
  member: Member
  latestRating: number | null
  series: number[]
  trend: number | null
}

/**
 * Roster row with the member's last rating and a mini rating-trend sparkline —
 * the dashboard's core list.
 */
export function MemberTrendRow({
  member,
  latestRating,
  series,
  trend,
}: MemberTrendRowProps) {
  return (
    <Link
      href={`/members/${member.id}`}
      className="flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
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

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
          <StatusBadge status={member.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.role}</p>
      </div>

      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        {latestRating !== null ? <StarRating value={latestRating} size="sm" /> : (
          <span className="text-xs text-muted-foreground">Sin registros</span>
        )}
        {series.length > 1 ? (
          <Sparkline data={series} className="w-20" />
        ) : null}
        <TrendDelta trend={trend} />
      </div>

      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
