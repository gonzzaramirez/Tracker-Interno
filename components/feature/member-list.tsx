"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MemberTrendRow } from "@/components/feature/member-trend-row"
import { MemberActions } from "@/components/feature/member-actions"
import type { MemberTrackingSummary } from "@/lib/services/tracking"

type MemberListProps = {
  summaries: MemberTrackingSummary[]
}

/** Roster list with a client-side search over name and role. */
export function MemberList({ summaries }: MemberListProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return summaries
    }
    return summaries.filter((summary) =>
      [summary.member.name, summary.member.role].join(" ").toLowerCase().includes(q),
    )
  }, [query, summaries])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="member-search" className="sr-only">
          Buscar miembros
        </Label>
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="member-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar miembros"
          placeholder="Buscar por nombre o rol…"
          className="ps-9"
        />
      </div>

      <ul className="divide-y divide-foreground/5">
        {filtered.map((summary) => (
          <li key={summary.member.id} className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <MemberTrendRow
                member={summary.member}
                latestRating={summary.latest?.record.rating ?? null}
                series={summary.series}
                trend={summary.trend}
              />
            </div>
            <MemberActions member={summary.member} />
          </li>
        ))}
      </ul>
    </div>
  )
}
