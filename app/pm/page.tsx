import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requirePm } from "@/lib/auth-guard"
import { listSupervisorsForPm } from "@/lib/db/repos/users"
import { listTaskGoals } from "@/lib/db/repos/task-sheets"
import { getAllTasks } from "@/lib/services/tasks"

export const metadata = {
  title: "Supervisores",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function PmPage() {
  await requirePm()
  const supervisors = await listSupervisorsForPm()

  // Contadores cross-tenant: objetivos activos y tareas con planilla por supervisor.
  const counters = await Promise.all(
    supervisors.map(async (supervisor) => {
      const [goals, tasks] = await Promise.all([
        listTaskGoals(supervisor.id),
        getAllTasks(supervisor.id),
      ])
      return {
        supervisorId: supervisor.id,
        activeGoals: goals.filter((goal) => goal.status === "active").length,
        sheetTaskCount: tasks.filter((task) => task.sheetUrl).length,
      }
    }),
  )
  const counterBySupervisor = new Map(counters.map((counter) => [counter.supervisorId, counter]))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Manager"
        title="Supervisores"
        description="Cada supervisor con su célula y el tamaño de su equipo — entrá para ver todo su seguimiento."
      />

      {supervisors.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Sin supervisores aún</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>
              No hay cuentas de supervisor registradas en el sistema.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supervisors.map((supervisor) => {
            const counter = counterBySupervisor.get(supervisor.id)
            return (
              <li key={supervisor.id}>
                <Link
                  href={`/pm/${supervisor.id}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl bg-muted/40 p-5 ring-1 ring-foreground/5 transition-colors hover:bg-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={`Ver equipo de ${supervisor.username}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
                      aria-hidden
                    >
                      {supervisor.username.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {supervisor.username}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {supervisor.celula || "Sin célula"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                      {supervisor.memberCount} miembros
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                      {supervisor.activeMemberCount} activos
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                      {counter?.activeGoals ?? 0} objetivos activos
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                      {counter?.sheetTaskCount ?? 0} tareas con planilla
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
