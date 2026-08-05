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
import { getAttendanceLog } from "@/lib/services/attendance"

export const metadata: Metadata = {
  title: "Asistencias",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AttendancePage() {
  const userId = await requireAuth()
  const members = await getMembers(userId)
  const allAttendanceLogs = await Promise.all(
    members.map((m) => getAttendanceLog(userId, m.id)),
  )
  const log = allAttendanceLogs.flat()

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
          <AppleCardTitle id="attendance-log-heading">Registro de asistencias</AppleCardTitle>
          {log.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FingerprintIcon />
                </EmptyMedia>
                <EmptyTitle>Sin marcas todavía</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  Cargá la primera asistencia con el formulario de arriba.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <AttendanceLog members={members} marks={log} />
          )}
        </AppleCard>
      </section>
    </div>
  )
}
