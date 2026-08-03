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
  title: "Miembros",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div>
      <PageHeader
        eyebrow="Plantilla"
        title="Miembros"
        description="Quiénes forman parte del equipo, su rol, estado y destacados de la semana actual."
      />

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
