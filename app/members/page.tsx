import { UsersIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { MemberForm } from "@/components/feature/member-form"
import { MemberList } from "@/components/feature/member-list"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getMembers } from "@/lib/services/members"
import { getMemberTrackingSummaries } from "@/lib/services/tracking"
import { requireAuth } from "@/lib/auth-guard"

export const metadata = {
  title: "Miembros",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function MembersPage() {
  const userId = await requireAuth()
  const members = await getMembers(userId)
  const summaries = await getMemberTrackingSummaries(userId, members)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plantilla"
        title="Miembros"
        description="Quiénes forman parte del equipo, su rol, estado y última nota."
      />

      <section
        aria-labelledby="members-new-heading"
        className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start"
      >
        <AppleCard className="lg:sticky lg:top-24">
          <AppleCardTitle id="members-new-heading">Agregar miembro</AppleCardTitle>
          <MemberForm mode="create" />
        </AppleCard>

        <AppleCard>
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
                  La plantilla está vacía — los miembros aparecerán acá una vez agregados.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <MemberList summaries={summaries} />
          )}
        </AppleCard>
      </section>
    </div>
  )
}
