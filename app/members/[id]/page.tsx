import { notFound } from "next/navigation"
import { MessageSquareTextIcon } from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { MemberProfileCard } from "@/components/feature/member-profile-card"
import { MemberCheckinConfig } from "@/components/feature/member-checkin-config"
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

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const feed = await getMemberFeed(id)
  return { title: feed ? feed.member.name : "Member not found" }
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

  const timeline = await getMemberTimeline(id)
  const timelineDesc =
    timeline.length === 0
      ? "No check-ins recorded yet."
      : `${timeline.length} check-in record${timeline.length === 1 ? "" : "s"}.`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Member"
        title={feed.member.name}
        description={feed.member.role}
      />

      <MemberProfileCard member={feed.member} />

      <MemberCheckinConfig member={feed.member} />

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Follow-up timeline</AppleCardTitle>
            <p className="text-sm text-muted-foreground">{timelineDesc}</p>
          </div>
        </AppleCardHeader>
        <Timeline entries={timeline} />
      </AppleCard>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Recent feedback</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Latest praise, coaching notes and concerns.
            </p>
          </div>
        </AppleCardHeader>
        {feed.feedback.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareTextIcon />
              </EmptyMedia>
              <EmptyTitle>No feedback yet</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
<EmptyDescription>
                Feedback entries for {feed.member.name.split(" ")[0]} will appear here.
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
