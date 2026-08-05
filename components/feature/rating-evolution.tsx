"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { TrendingUpIcon } from "lucide-react"

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
  rating: {
    label: "Nota",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
  })
}

type RatingEvolutionProps = {
  series: Array<{ date: string; rating: number }>
  memberName: string
}

/** Line chart of the member's ratings over time, oldest first. */
export function RatingEvolution({ series, memberName }: RatingEvolutionProps) {
  if (series.length === 0) {
    return (
      <Empty className="min-h-48">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUpIcon className="size-4" aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Sin evolución aún</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Cuando registres seguimientos, la evolución de {memberName} aparecerá acá.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  const data = series.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }))

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-video w-full min-h-48">
      <LineChart
        accessibilityLayer
        aria-label={`Evolución de la nota de ${memberName}`}
        data={data}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
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
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={24}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent />} />
        <Line
          dataKey="rating"
          name="Nota"
          type="monotone"
          stroke="var(--color-rating)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
