import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import type { Member } from "@/lib/domain"
import { StatusBadge } from "@/components/feature/status-badge"
import { WeekHighlights } from "@/components/feature/week-highlights"
import type { WeekHighlight } from "@/lib/domain"

type MemberRowProps = {
  member: Member
  highlights?: WeekHighlight[]
}

/**
 * Dashboard / members-list row (REQ-WD-001, REQ-MF-001): avatar dot with the
 * member color, role, status badge and current-week highlights.
 */
export function MemberRow({ member, highlights = [] }: MemberRowProps) {
  return (
    <Link
      href={`/members/${member.id}`}
      className="flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden
      >
        {member.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
          <StatusBadge status={member.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.role}</p>
      </div>
      <WeekHighlights highlights={highlights} />
      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
