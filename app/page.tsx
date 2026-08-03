import Link from "next/link"
import {
  CalendarDaysIcon,
  CheckSquareIcon,
  MessageSquareTextIcon,
  UsersIcon,
} from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { MemberRow } from "@/components/feature/member-row"
import { MetricCard } from "@/components/feature/metric-card"
import { CheckInBanner } from "@/components/feature/check-in-banner"
import { OccupancyChart } from "@/components/feature/occupancy-chart"
import { TrendChart } from "@/components/feature/trend-chart"
import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getDueCheckIns,
} from "@/lib/services/checkins"
import {
  getWeeklyMetrics,
  getWeeklyOverview,
  getWeeklyOccupancy,
} from "@/lib/services/dashboard"

export const metadata = {
  title: "Panel",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function DashboardPage() {
  const [overview, metrics, dueCheckIns, occupancy] = await Promise.all([
    getWeeklyOverview(),
    getWeeklyMetrics(),
    getDueCheckIns(),
    getWeeklyOccupancy(),
  ])

  const averageLabel =
    metrics.feedbackAvg === null ? "Sin valoración aún" : metrics.feedbackAvg.toFixed(1)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Esta semana"
        title="Panel del equipo"
        description="Destacados de cada miembro — ausencias próximas, tareas vencidas hoy y seguimientos vencidos."
      />

      <CheckInBanner reminders={dueCheckIns} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Miembros"
          value={metrics.memberCount}
          hint="Plantilla activa"
          icon={UsersIcon}
          tone="blue"
          href="/members"
        />
        <MetricCard
          label="Tareas abiertas"
          value={metrics.openTasks}
          hint={`${metrics.completedTasks} completadas`}
          icon={CheckSquareIcon}
          tone="violet"
          href="/tasks"
        />
        <MetricCard
          label="Calificación promedio"
          value={averageLabel}
          hint={`${metrics.feedbackCount} registros`}
          icon={MessageSquareTextIcon}
          tone="green"
          href="/feedback"
        />
        <MetricCard
          label="Ausencias esta semana"
          value={metrics.timeOffCount}
          hint="Ausencias aprobadas"
          icon={CalendarDaysIcon}
          tone="amber"
          href="/calendar"
        />
      </div>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Actividad semanal</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Últimos 7 días — actualizaciones de progreso y valoraciones realizadas.
            </p>
          </div>
        </AppleCardHeader>
        <TrendChart series={metrics.series} />
      </AppleCard>

      <OccupancyChart data={occupancy} />

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Miembros</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Destacados de la semana actual por persona.
            </p>
          </div>
          <Link
            href="/members"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Ver todo
          </Link>
        </AppleCardHeader>
        {overview.members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>Sin miembros aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                La plantilla está vacía — agregá miembros para empezar a seguir la semana.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {overview.members.map(({ member, highlights }) => (
              <li key={member.id}>
                <MemberRow member={member} highlights={highlights} />
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
