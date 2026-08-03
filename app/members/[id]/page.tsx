import { notFound } from "next/navigation"
import { MessageSquareTextIcon } from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { MemberProfileCard } from "@/components/feature/member-profile-card"
import { MemberCheckinConfig } from "@/components/feature/member-checkin-config"
import { MemberTimeOffFeed } from "@/components/feature/member-time-off-feed"
import { TaskList, type MemberTaskGroup } from "@/components/feature/task-list"
import { Timeline } from "@/components/feature/timeline"
import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getMemberFeed, getMemberTimeline } from "@/lib/services/members"
import { getTasksWithProgressByMember } from "@/lib/services/tasks"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const feed = await getMemberFeed(id)
  return { title: feed ? feed.member.name : "Miembro no encontrado" }
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const feed = await getMemberFeed(id)

  // Unknown member id → real 404 (decision D8, REQ-MF-002 edge).
  if (!feed) {
    notFound()
  }

  const [timeline, tasksWithProgress] = await Promise.all([
    getMemberTimeline(id),
    getTasksWithProgressByMember(id),
  ])
  const taskGroup: MemberTaskGroup = {
    member: feed.member,
    active: tasksWithProgress.filter((entry) => entry.task.status !== "done"),
    done: tasksWithProgress.filter((entry) => entry.task.status === "done"),
  }
  const timelineDesc =
    timeline.length === 0
      ? "Sin check-ins registrados aún."
      : `${timeline.length} registro de check-in${timeline.length === 1 ? "" : "s"}.`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Miembro"
        title={feed.member.name}
        description={feed.member.role}
      />

      <MemberProfileCard member={feed.member} />

      <MemberCheckinConfig member={feed.member} />

      <TaskList groups={[taskGroup]} members={[feed.member]} />

      <MemberTimeOffFeed entries={feed.timeOff} />

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Línea de tiempo</AppleCardTitle>
            <p className="text-sm text-muted-foreground">{timelineDesc}</p>
          </div>
        </AppleCardHeader>
        <Timeline entries={timeline} />
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Valoraciones recientes</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Últimos reconocimientos, notas de coaching y preocupaciones.
            </p>
          </div>
        </AppleCardHeader>
        {feed.feedback.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareTextIcon />
              </EmptyMedia>
              <EmptyTitle>Sin valoración aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
                <EmptyDescription>
                Las valoraciones de {feed.member.name.split(" ")[0]} aparecerán acá.
                </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {feed.feedback.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl bg-muted/60 px-4 py-3 text-sm"
              >
                <p className="text-muted-foreground">{entry.content}</p>
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
