import { CalendarDaysIcon, BriefcaseBusinessIcon } from "lucide-react"

import type { Member } from "@/lib/domain"
import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { StatusBadge } from "@/components/feature/status-badge"

type MemberProfileCardProps = {
  member: Member
}

function formatJoinedAt(joinedAt: string): string {
  return new Date(`${joinedAt}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

/**
 * Member profile header: avatar, role/area, status, joinedAt and notes
 * (REQ-MF-002).
 */
export function MemberProfileCard({ member }: MemberProfileCardProps) {
  return (
    <AppleCard>
      <AppleCardHeader>
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] text-lg font-semibold text-white shadow-sm"
            style={{ backgroundColor: member.displayColor }}
            aria-hidden
          >
            {member.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AppleCardTitle>{member.name}</AppleCardTitle>
              <StatusBadge status={member.status} />
            </div>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        </div>
      </AppleCardHeader>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BriefcaseBusinessIcon className="size-4 shrink-0" />
          <dt className="w-16 shrink-0 font-medium">Area</dt>
          <dd className="text-foreground">{member.role}</dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDaysIcon className="size-4 shrink-0" />
          <dt className="w-16 shrink-0 font-medium">Joined</dt>
          <dd className="text-foreground">{formatJoinedAt(member.joinedAt)}</dd>
        </div>
      </dl>

      {member.notes ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          {member.notes}
        </p>
      ) : null}
    </AppleCard>
  )
}