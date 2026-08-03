"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { BarChart3Icon } from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
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
import type { WeeklyOccupancyPoint } from "@/lib/domain"

const CHART_CONFIG = {
  count: {
    label: "Miembros ausentes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function formatDate(dateISO: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateISO}T00:00:00`))
}

function EmptyOccupancy({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite">
      <Empty className="min-h-60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3Icon className="size-4" aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Sin datos de disponibilidad</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  )
}

/** Responsive weekly approved-absence chart. Data is supplied by the RSC page. */
export function OccupancyChart({
  data,
  loading = false,
}: {
  data: WeeklyOccupancyPoint[]
  loading?: boolean
}) {
  const noApprovedAbsences = data.length > 0 && data.every((point) => point.count === 0)

  return (
    <AppleCard>
      <AppleCardHeader>
        <div>
          <AppleCardTitle>Disponibilidad semanal</AppleCardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Ausencias aprobadas por día, de lunes a domingo.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Solo aprobadas
        </span>
      </AppleCardHeader>

      {loading ? (
        <div
          className="flex min-h-60 items-center justify-center rounded-2xl bg-muted/40"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="text-sm text-muted-foreground">Cargando disponibilidad…</span>
        </div>
      ) : data.length === 0 ? (
        <EmptyOccupancy message="La semana actual no tiene registros de disponibilidad aún." />
      ) : noApprovedAbsences ? (
        <EmptyOccupancy message="Sin ausencias aprobadas esta semana." />
      ) : (
        <ChartContainer config={CHART_CONFIG} className="aspect-video min-h-60 w-full">
          <BarChart
            accessibilityLayer
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
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={24}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const point = payload[0]?.payload as WeeklyOccupancyPoint | undefined
                    return point ? formatDate(point.date) : ""
                  }}
                />
              }
            />
            <Bar
              dataKey="count"
              name="Miembros ausentes"
              fill="var(--color-count)"
              radius={[8, 8, 0, 0]}
              maxBarSize={52}
            />
          </BarChart>
        </ChartContainer>
      )}
    </AppleCard>
  )
}
