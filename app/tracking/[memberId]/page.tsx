import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, MessageSquareTextIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { TrackingHistory } from "@/components/feature/tracking-history"
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
import { getByMember } from "@/lib/services/tracking"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>
}): Promise<Metadata> {
  const userId = await requireAuth()
  const { memberId } = await params
  const member = await getMember(userId, memberId)
  return { title: member ? `Seguimiento · ${member.name}` : "Seguimiento" }
}

export default async function MemberTrackingPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const userId = await requireAuth()
  const { memberId } = await params
  const member = await getMember(userId, memberId)
  if (!member) {
    notFound()
  }
  const entries = await getByMember(userId, member.id)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link
          href="/tracking"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Volver a seguimiento
        </Link>
        <div className="mt-3">
          <PageHeader
            title={`Historial de ${member.name}`}
            description={`Todos los registros de seguimiento de ${member.name} — podés editarlos o eliminarlos.`}
          />
        </div>
      </div>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Registros</AppleCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {entries.length} registro{entries.length === 1 ? "" : "s"} en total, del más nuevo al más viejo.
            </p>
          </div>
        </AppleCardHeader>
        {entries.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareTextIcon />
              </EmptyMedia>
              <EmptyTitle>Sin registros aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Cargá el primer registro de {member.name.split(" ")[0]} desde la página de
                seguimiento.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <TrackingHistory member={member} entries={entries} />
        )}
      </AppleCard>
    </div>
  )
}
