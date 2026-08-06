import type { Metadata } from "next"
import { FingerprintIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { AttendanceForm } from "@/components/feature/attendance-form"
import { AttendanceLog } from "@/components/feature/attendance-log"
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
import { getAttendanceByDate } from "@/lib/services/attendance"
import { AttendanceFilter } from "@/components/feature/attendance-filter"
import { isISODate, todayISO } from "@/lib/domain/date"

export const metadata: Metadata = {
  title: "Asistencias",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type AttendancePageProps = {
  searchParams: Promise<{ date?: string | string[] }>
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const { date: dateParam } = await searchParams
  const selectedDate = typeof dateParam === "string" && isISODate(dateParam) ? dateParam : todayISO()
  const userId = await requireAuth()
  const members = await getMembers(userId)
  const marks = await getAttendanceByDate(userId, selectedDate)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Asistencias"
        description="Registrá quién estuvo activo y a qué hora marcó presencia."
      />

      <section aria-labelledby="attendance-new-heading">
        <AppleCard>
          <AppleCardTitle id="attendance-new-heading">Nuevo registro</AppleCardTitle>
          <AttendanceForm members={members} />
        </AppleCard>
      </section>

      <section aria-labelledby="attendance-log-heading">
        <AppleCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AppleCardTitle id="attendance-log-heading">
              Registro de asistencias — {selectedDate === todayISO() ? "hoy" : selectedDate}
            </AppleCardTitle>
            <AttendanceFilter date={selectedDate} />
          </div>
          {marks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FingerprintIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {selectedDate === todayISO() ? "Sin marcas hoy" : `Sin marcas el ${selectedDate}`}
                </EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  {selectedDate === todayISO()
                    ? "Cargá la primera asistencia con el formulario de arriba."
                    : "No hay registros para ese día — cambiá la fecha para ver otro día."}
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <AttendanceLog members={members} marks={marks} />
          )}
        </AppleCard>
      </section>
    </div>
  )
}
