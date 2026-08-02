import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { StarRating } from "@/components/feature/star-rating"
import { FeedbackList } from "@/components/feature/feedback-list"
import { FeedbackForm } from "@/components/feature/feedback-form"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { getMembers } from "@/lib/services/members"
import { getByMember, getAverageRating } from "@/lib/services/feedback"

export const metadata: Metadata = {
  title: "Feedback — Team Tracker",
}

export default async function FeedbackPage() {
  const members = await getMembers()
  const sections = await Promise.all(
    members.map(async (member) => ({
      member,
      entries: await getByMember(member.id),
      average: await getAverageRating(member.id),
    }))
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Feedback"
        description="Share notes on how each member is doing."
      />

      <section aria-labelledby="feedback-new-heading">
        <AppleCard>
          <AppleCardTitle id="feedback-new-heading">New entry</AppleCardTitle>
          <FeedbackForm members={members} />
        </AppleCard>
      </section>

      <section aria-labelledby="feedback-history-heading">
        <AppleCard>
          <AppleCardTitle id="feedback-history-heading">History</AppleCardTitle>
          <div className="space-y-8">
              {sections.map(({ member, entries, average }) => (
                <div key={member.id}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-foreground">{member.name}</h2>
                    <StarRating value={average ?? 0} showValue size="sm" />
                  </div>
                  <FeedbackList memberName={member.name} entries={entries} />
                </div>
              ))}
            </div>
        </AppleCard>
      </section>
    </div>
  )
}