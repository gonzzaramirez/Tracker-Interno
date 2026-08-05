import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/feature/sparkline"

const TONES = {
  neutral: "bg-muted text-foreground",
  blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
  green: "bg-green-500/10 text-green-600 dark:bg-green-400/15 dark:text-green-300",
  amber: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
} as const

export type MetricTone = keyof typeof TONES

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: MetricTone
  href?: string
  /** Optional mini-series for a sparkline at the bottom of the card. */
  sparkline?: number[]
}

/**
 * Apple-style summary metric card (REQ-WD-002). Optional `href` turns the
 * card into a dashboard navigation entry (REQ-WD-003).
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
  sparkline,
}: MetricCardProps) {
  return (
    <div className="group/metric-card relative flex flex-col gap-2 rounded-(--radius-card) bg-card p-5 ring-1 ring-foreground/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {sparkline ? <Sparkline data={sparkline} /> : null}
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 rounded-(--radius-card) focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`Open ${label}`}
        />
      ) : null}
    </div>
  )
}