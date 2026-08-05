import {
  MessageSquareTextIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { MemberTrendRow } from "@/components/feature/member-trend-row"
import { MetricCard } from "@/components/feature/metric-card"
import { QuickAttendance } from "@/components/feature/quick-attendance"
import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getMembers } from "@/lib/services/members"
import { getMemberTrackingSummaries, getTrackingMetrics } from "@/lib/services/tracking"
import { getPresentToday } from "@/lib/services/attendance"

export const metadata = {
  title: "Panel",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { requireAuth } from "@/lib/auth-guard"

export default async function DashboardPage() {
  const userId = await requireAuth()
  const [members, metrics] = await Promise.all([
    getMembers(userId),
    getTrackingMetrics(userId),
  ])
  const summaries = await getMemberTrackingSummaries(userId, members)
  const presentToday = await getPresentToday(userId, members)

  const averageLabel =
    metrics.averageRating === null ? "Sin registros" : metrics.averageRating.toFixed(1)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Seguimiento"
        title="Panel de rendimiento"
        description="Última nota y tendencia de cada persona — entrá a su perfil para ver la evolución completa."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Miembros"
          value={members.length}
          hint="Plantilla activa"
          icon={UsersIcon}
          tone="blue"
          href="/members"
        />
        <MetricCard
          label="Registros"
          value={metrics.recordCount}
          hint="Seguimientos cargados"
          icon={MessageSquareTextIcon}
          tone="violet"
          href="/tracking"
        />
        <MetricCard
          label="Promedio general"
          value={averageLabel}
          hint="Nota 1-5"
          icon={StarIcon}
          tone="green"
          href="/tracking"
        />
      </div>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Asistencia de hoy</AppleCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Marcá quién dio los buenos días y está activo hoy.
            </p>
          </div>
        </AppleCardHeader>
        <QuickAttendance members={members} presentIds={presentToday.map((member) => member.id)} />
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Miembros</AppleCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Última nota, tendencia y estado actual por persona.
            </p>
          </div>
        </AppleCardHeader>
        {members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>Sin miembros aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                La plantilla está vacía — agregá miembros para empezar el seguimiento.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {summaries.map((summary) => (
              <li key={summary.member.id}>
                <MemberTrendRow
                  member={summary.member}
                  latestRating={summary.latest?.record.rating ?? null}
                  series={summary.series}
                  trend={summary.trend}
                />
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
