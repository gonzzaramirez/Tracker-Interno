import { notFound } from "next/navigation"
import { CalendarClockIcon, TrendingUpIcon } from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { EvaluationEvolution } from "@/components/feature/evaluation-evolution"
import { MemberActions } from "@/components/feature/member-actions"
import { MemberProfileCard } from "@/components/feature/member-profile-card"
import { RatingEvolution } from "@/components/feature/rating-evolution"
import { TrackingRecordCard } from "@/components/feature/tracking-record-card"
import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from "@/lib/auth-guard"
import { getMember } from "@/lib/services/members"
import { getTimeOffByMember } from "@/lib/services/timeoff"
import { getByMemberAsc, getLatestByMember } from "@/lib/services/tracking"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireAuth()
  const { id } = await params
  const member = await getMember(userId, id)
  return { title: member ? member.name : "Miembro no encontrado" }
}

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await requireAuth()
  const { id } = await params
  const member = await getMember(userId, id)
  if (!member) {
    notFound()
  }

  const [latest, all, timeOff] = await Promise.all([
    getLatestByMember(userId, id),
    getByMemberAsc(userId, id),
    getTimeOffByMember(userId, id),
  ])
  const firstName = member.name.split(" ")[0]

  const series = all
    .filter(({ record }) => record.rating !== null)
    .map(({ record }) => ({
      date: record.recordDate,
      rating: record.rating as number,
    }))
  const approvedTimeOff = timeOff.filter((entry) => entry.status === "approved")

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          eyebrow="Miembro"
          title={member.name}
          description={member.role}
        />
        <MemberActions member={member} />
      </div>

      <MemberProfileCard member={member} />

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Último registro</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              La nota y el comentario más recientes de {firstName}.
            </p>
          </div>
        </AppleCardHeader>
        {latest ? (
          <TrackingRecordCard entry={latest} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TrendingUpIcon />
              </EmptyMedia>
              <EmptyTitle>Sin registros aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Cuando registres el primer seguimiento de {firstName}, aparecerá acá.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Evolución</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Cómo cambió la nota de {firstName} a lo largo del tiempo.
            </p>
          </div>
        </AppleCardHeader>
        <RatingEvolution series={series} memberName={firstName} />
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Evaluación por áreas</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Puntaje actual de cada área y en qué fecha cambió.
            </p>
          </div>
        </AppleCardHeader>
        <EvaluationEvolution entries={all} memberName={firstName} />
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Ausencias</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Ausencias aprobadas de {firstName}.
            </p>
          </div>
        </AppleCardHeader>
        {approvedTimeOff.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClockIcon />
              </EmptyMedia>
              <EmptyTitle>Sin ausencias</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Las ausencias aprobadas de {firstName} aparecerán acá.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {approvedTimeOff.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {entry.startDate === entry.endDate
                    ? formatDate(entry.startDate)
                    : `${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}`}
                </p>
                <span className="text-sm text-muted-foreground">{entry.type}</span>
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
