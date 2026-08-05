import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, MessageSquareTextIcon, UsersIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { TrackingForm } from "@/components/feature/tracking-form"
import { StarRating } from "@/components/feature/star-rating"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from "@/lib/auth-guard"
import { getMembers } from "@/lib/services/members"
import { getMemberTrackingSummaries } from "@/lib/services/tracking"

export const metadata: Metadata = {
  title: "Seguimiento",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TrackingPage() {
  const userId = await requireAuth()
  const members = await getMembers(userId)
  const summaries = await getMemberTrackingSummaries(userId, members)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Seguimiento"
        description="Registrá cómo viene cada persona y entrá a su historial para ver la evolución completa."
      />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="tracking-new-heading" className="lg:sticky lg:top-24">
          <AppleCard>
            <AppleCardTitle id="tracking-new-heading">Nuevo registro</AppleCardTitle>
            <TrackingForm
              members={members}
              layout="single"
              latestEvaluations={Object.fromEntries(
                summaries.map((summary) => [summary.member.id, summary.latestEvaluations]),
              )}
            />
          </AppleCard>
        </section>

        <section aria-labelledby="tracking-people-heading">
          <AppleCard>
            <AppleCardHeader>
              <div>
                <AppleCardTitle id="tracking-people-heading">Personas</AppleCardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Última nota y estado de cada una — entrá para ver su historial.
                </p>
              </div>
            </AppleCardHeader>

            {summaries.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin miembros aún</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <EmptyDescription>
                    Agregá miembros para empezar a registrar seguimientos.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {summaries.map(({ member, latest, records }) => {
                  return (
                    <li key={member.id}>
                      <Link
                        href={`/tracking/${member.id}`}
                        aria-label={`Ver historial de ${member.name}`}
                        className="flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3"
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                          style={member.displayColor ? { backgroundColor: member.displayColor } : undefined}
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
                          <p className="truncate text-sm font-semibold text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {records.length} registro{records.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2.5">
                          {latest ? (
                            <>
                              {latest.record.rating !== null ? (
                                <StarRating value={latest.record.rating} size="sm" />
                              ) : (
                                <span className="text-xs text-muted-foreground">Sin nota</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin registros</span>
                          )}
                          <ArrowRightIcon
                            className="size-4 text-muted-foreground"
                            aria-hidden
                          />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </AppleCard>
        </section>
      </div>

      {summaries.every((summary) => summary.records.length === 0) && summaries.length > 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquareTextIcon className="size-4" aria-hidden />
          Todavía no hay registros — cargá el primero con el formulario.
        </p>
      ) : null}
    </div>
  )
}
