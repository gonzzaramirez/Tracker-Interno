"use client"

import { Area, AreaChart } from "recharts"

import { cn } from "@/lib/utils"

/** Render a small inline sparkline (Recharts area) from a numeric series. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const chartData = data.map((value, index) => ({ index, value }))
  return (
    <div className={cn("h-8 w-full", className)} aria-hidden>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={1.5}
          fill="url(#sparkline-fill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  )
}
