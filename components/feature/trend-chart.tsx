"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { BarChart3Icon } from "lucide-react"

import type { SeriesPoint } from "@/lib/domain"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const CHART_CONFIG = {
  recorded: {
    label: "Progress updates",
    color: "var(--chart-1)",
  },
  feedback: {
    label: "Feedback",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short" })

function weekdayLabel(dateISO: string): string {
  return DAY_LABEL_FORMATTER.format(new Date(`${dateISO}T00:00:00`))
}

/**
 * 7-day trend of follow-up records and feedback (REQ-WD-002).
 * Renders an explicit empty state instead of crashing on an empty series.
 */
export function TrendChart({ series }: { series: SeriesPoint[] }) {
  if (!series || series.length === 0) {
    return (
      <Empty className="aspect-video">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3Icon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>No weekly data yet</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Log follow-ups or feedback during the week and the trend will appear here.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  const data = series.map((point) => ({
    ...point,
    label: weekdayLabel(point.date),
  }))

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-video">
      <AreaChart
        accessibilityLayer
        aria-label="Weekly progress updates and feedback trend"
        data={data}
        margin={{ left: 0, right: 0, top: 4 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={24}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent />} />
        <Area
          dataKey="recorded"
          type="monotone"
          stroke="var(--color-recorded)"
          fill="var(--color-recorded)"
          fillOpacity={0.16}
          strokeWidth={2}
        />
        <Area
          dataKey="feedback"
          type="monotone"
          stroke="var(--color-feedback)"
          fill="var(--color-feedback)"
          fillOpacity={0.12}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
