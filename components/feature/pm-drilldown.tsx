"use client"

import { useState } from "react"
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
  FingerprintIcon,
  LayoutGridIcon,
  MessageSquareTextIcon,
  RefreshCwIcon,
  TargetIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"

import { AppleCard, AppleCardDescription, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { StarRating } from "@/components/feature/star-rating"
import { StatusBadge } from "@/components/feature/status-badge"
import { TaskGoalList } from "@/components/feature/task-goal-list"
import { TiptapView } from "@/components/feature/tiptap-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type {
  Board,
  Member,
  Task,
  TimeOff,
  TimeOffStatus,
  TimeOffType,
  User,
} from "@/lib/domain"
import type { MemberTrackingSummary } from "@/lib/services/tracking"
import type { TaskGoalView } from "@/lib/services/task-sheets"
import { cn } from "@/lib/utils"

const TIME_OFF_LABELS: Record<TimeOffType, string> = {
  vacation: "Vacaciones",
  license: "Licencia",
  sickness: "Enfermedad",
  holiday: "Feriado",
}

const TIME_OFF_STATUS_LABELS: Record<TimeOffStatus, string> = {
  pending: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
}

const TABS = [
  { id: "members", label: "Miembros", icon: UsersIcon },
  { id: "tracking", label: "Seguimientos", icon: MessageSquareTextIcon },
  { id: "calendar", label: "Calendario", icon: CalendarDaysIcon },
  { id: "attendance", label: "Asistencias", icon: FingerprintIcon },
  { id: "boards", label: "Pizarras", icon: LayoutGridIcon },
  { id: "goals", label: "Objetivos", icon: TargetIcon },
] as const

type TabId = (typeof TABS)[number]["id"]

type PmDrilldownProps = {
  supervisor: User
  summaries: MemberTrackingSummary[]
  metrics: { recordCount: number; averageRating: number | null }
  timeOff: TimeOff[]
  presentMemberIds: string[]
  boards: Board[]
  /** Tareas del supervisor con planilla vinculada + sus objetivos (read-only). */
  taskGoals: Array<{ task: Task; views: TaskGoalView[] }>
}

function formatShortDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatSyncDate(isoString: string): string {
  return new Date(isoString).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateTime(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function MemberAvatar({ member }: { member: Member }) {
  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
      style={member.displayColor ? { backgroundColor: member.displayColor } : undefined}
      aria-hidden
    >
      {initials}
    </span>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{text}</p>
}

/**
 * Read-only PM drill-down: one supervisor, all their team data, in tabs.
 * Nothing here mutates — the PM watches, the supervisor acts.
 */
export function PmDrilldown({
  supervisor,
  summaries,
  metrics,
  timeOff,
  presentMemberIds,
  boards,
  taskGoals,
}: PmDrilldownProps) {
  const [tab, setTab] = useState<TabId>("members")

  const members = summaries.map((summary) => summary.member)
  const memberById = new Map(members.map((member) => [member.id, member]))
  const presentMembers = members.filter((member) => presentMemberIds.includes(member.id))

  const allRecords = summaries
    .flatMap((summary) =>
      summary.records.map((entry) => ({
        member: summary.member,
        record: entry.record,
        evaluations: entry.evaluations,
      })),
    )
    .sort((a, b) => {
      if (a.record.recordDate !== b.record.recordDate) {
        return b.record.recordDate.localeCompare(a.record.recordDate)
      }
      return b.record.createdAt.localeCompare(a.record.createdAt)
    })

  const averageLabel =
    metrics.averageRating === null ? "Sin registros" : metrics.averageRating.toFixed(1)

  return (
    <div className="space-y-6">
      <AppleCard>
        <AppleCardHeader>
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-base font-semibold text-background"
              aria-hidden
            >
              {supervisor.username.charAt(0).toUpperCase()}
            </span>
            <div>
              <AppleCardTitle>{supervisor.username}</AppleCardTitle>
              <AppleCardDescription>
                {supervisor.celula ? `Célula: ${supervisor.celula}` : "Sin célula definida"}
              </AppleCardDescription>
            </div>
          </div>
        </AppleCardHeader>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Miembros", value: members.length },
            { label: "Activos", value: members.filter((m) => m.status === "active").length },
            { label: "Registros", value: metrics.recordCount },
            { label: "Promedio", value: averageLabel },
            { label: "Licencias", value: timeOff.length },
            { label: "Presentes hoy", value: presentMembers.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </AppleCard>

      <div
        role="tablist"
        aria-label="Datos del supervisor"
        className="flex gap-1 overflow-x-auto rounded-full bg-muted/40 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-background text-foreground shadow-sm",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === "members" ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Equipo</AppleCardTitle>
              <AppleCardDescription>Última nota de cada miembro.</AppleCardDescription>
            </div>
          </AppleCardHeader>
          {summaries.length === 0 ? (
            <EmptyNote text="Este supervisor todavía no tiene miembros." />
          ) : (
            <ul className="divide-y divide-foreground/5">
              {summaries.map((summary) => (
                <li key={summary.member.id} className="flex items-center gap-4 px-2 py-3 sm:px-3">
                  <MemberAvatar member={summary.member} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {summary.member.name}
                      </p>
                      <StatusBadge status={summary.member.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{summary.member.role}</p>
                    {summary.latest?.record ? (
                      <TiptapView
                        html={summary.latest.record.contentHtml}
                        className="mt-1 line-clamp-2 text-sm text-muted-foreground"
                      />
                    ) : null}
                  </div>
                  {summary.latest?.record.rating !== null &&
                  summary.latest?.record.rating !== undefined ? (
                    <StarRating value={summary.latest.record.rating} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin registros</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AppleCard>
      ) : null}

      {tab === "tracking" ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Seguimientos</AppleCardTitle>
              <AppleCardDescription>Todos los registros, del más reciente al más antiguo.</AppleCardDescription>
            </div>
          </AppleCardHeader>
          {allRecords.length === 0 ? (
            <EmptyNote text="No hay seguimientos registrados." />
          ) : (
            <ul className="divide-y divide-foreground/5">
              {allRecords.map(({ member, record, evaluations }) => (
                <li key={record.id} className="px-2 py-3 sm:px-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(record.recordDate)}
                    </span>
                    {record.rating !== null ? (
                      <span className="ml-auto">
                        <StarRating value={record.rating} size="sm" />
                      </span>
                    ) : null}
                  </div>
                  {evaluations.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {evaluations.map((evaluation) => evaluation.areaId).join(" · ")} evaluados
                    </p>
                  ) : null}
                  <TiptapView
                    html={record.contentHtml}
                    className="mt-1.5 line-clamp-3 text-sm text-muted-foreground"
                  />
                </li>
              ))}
            </ul>
          )}
        </AppleCard>
      ) : null}

      {tab === "calendar" ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Calendario</AppleCardTitle>
              <AppleCardDescription>Licencias y ausencias planificadas.</AppleCardDescription>
            </div>
          </AppleCardHeader>
          {timeOff.length === 0 ? (
            <EmptyNote text="No hay licencias registradas." />
          ) : (
            <ul className="divide-y divide-foreground/5">
              {timeOff.map((entry) => {
                const member = memberById.get(entry.memberId)
                return (
                  <li key={entry.id} className="flex flex-wrap items-center gap-2 px-2 py-3 sm:px-3">
                    <p className="text-sm font-semibold text-foreground">
                      {member?.name ?? "Miembro eliminado"}
                    </p>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground">
                      {TIME_OFF_LABELS[entry.type]}
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground">
                      {TIME_OFF_STATUS_LABELS[entry.status]}
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {formatShortDate(entry.startDate)}
                      {entry.endDate !== entry.startDate ? ` → ${formatShortDate(entry.endDate)}` : ""}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </AppleCard>
      ) : null}

      {tab === "attendance" ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Asistencia de hoy</AppleCardTitle>
              <AppleCardDescription>Quiénes marcaron presencia hoy.</AppleCardDescription>
            </div>
          </AppleCardHeader>
          {presentMembers.length === 0 ? (
            <EmptyNote text="Nadie marcó presencia hoy todavía." />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {presentMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 rounded-full bg-foreground/5 py-1 pr-3 pl-1"
                >
                  <MemberAvatar member={member} />
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                </li>
              ))}
            </ul>
          )}
        </AppleCard>
      ) : null}

      {tab === "boards" ? (
        <AppleCard>
          <AppleCardHeader>
            <div>
              <AppleCardTitle>Pizarras</AppleCardTitle>
              <AppleCardDescription>Pizarras Excalidraw del supervisor (solo lectura).</AppleCardDescription>
            </div>
          </AppleCardHeader>
          {boards.length === 0 ? (
            <EmptyNote text="No hay pizarras creadas." />
          ) : (
            <ul className="divide-y divide-foreground/5">
              {boards.map((board) => (
                <li key={board.id} className="flex items-center gap-3 px-2 py-3 sm:px-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                    <LayoutGridIcon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{board.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Creada el {formatDateTime(board.createdAt)} · modificada el{" "}
                      {formatDateTime(board.updatedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppleCard>
      ) : null}
      {tab === "goals" ? (
        <div className="space-y-4">
          {taskGoals.length === 0 ? (
            <AppleCard>
              <AppleCardHeader>
                <div>
                  <AppleCardTitle>Objetivos de planillas</AppleCardTitle>
                  <AppleCardDescription>
                    Metas por usuario sobre las tareas importadas — el progreso se actualiza solo con cada sync.
                  </AppleCardDescription>
                </div>
              </AppleCardHeader>
              <EmptyNote text="Este supervisor no tiene tareas con planilla vinculada." />
            </AppleCard>
          ) : (
            taskGoals.map(({ task, views }) => (
              <AppleCard key={task.id}>
                <AppleCardHeader>
                  <div className="min-w-0">
                    <AppleCardTitle>{task.title}</AppleCardTitle>
                    <AppleCardDescription>
                      <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
                        <RefreshCwIcon className="size-3.5" aria-hidden />
                        {task.lastSyncedAt
                          ? `Última sincronización ${formatSyncDate(task.lastSyncedAt)}`
                          : "Sin sincronizar"}
                        {task.sheetUrl ? (
                          <>
                            {" · "}
                            <a
                              href={task.sheetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                            >
                              Ver planilla <ExternalLinkIcon className="size-3" aria-hidden />
                            </a>
                          </>
                        ) : null}
                      </span>
                    </AppleCardDescription>
                  </div>
                </AppleCardHeader>

                {task.lastSyncError ? (
                  <Alert variant="destructive">
                    <TriangleAlertIcon className="size-4" aria-hidden />
                    <AlertTitle>Error de sincronización</AlertTitle>
                    <AlertDescription>{task.lastSyncError}</AlertDescription>
                  </Alert>
                ) : null}

                {views.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Sin objetivos creados — los objetivos se crean desde el detalle de la tarea.
                  </p>
                ) : (
                  <TaskGoalList views={views} readOnly showTaskHeader={false} />
                )}
              </AppleCard>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
