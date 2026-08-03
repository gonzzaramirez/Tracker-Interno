import { UsersIcon } from "lucide-react"

import { MemberRow } from "@/components/feature/member-row"
import { PageHeader } from "@/components/layout/page-header"
import { AppleCard } from "@/components/feature/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getMembers } from "@/lib/services/members"

export const metadata = {
  title: "Members",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Members"
        description="Who's in the team, their role, status and current-week highlights."
      />

      <AppleCard>
        {members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No members yet</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                The roster is empty — members will appear here once added.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {members.map((member) => (
              <li key={member.id}>
                <MemberRow member={member} />
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
