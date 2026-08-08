"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDownIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTaskGoalAction, getTaskSheetMembersAction } from "@/lib/actions/tasks"
import type { Task, TaskSheetMember } from "@/lib/domain"
import { SHEET_GOAL_TYPES, SHEET_GOAL_TYPES_LABELS } from "@/lib/domain/sheet"
import { cn } from "@/lib/utils"

type TaskSheetMemberWithName = TaskSheetMember & { memberName: string }

type TaskGoalFormProps = {
  /** Tareas con planilla vinculada (para el selector cuando aplica). */
  tasks: Task[]
  /** Cuando se setea, la tarea está fijada y NO se muestra el selector. */
  defaultTaskId?: string
  /** Modo colapsable (patrón del detalle de tarea). */
  collapsible?: boolean
  title?: string
}

/**
 * Form de creación de objetivos de planilla. Modelo: el objetivo pertenece a
 * una TAREA y se le agregan 1 o más usuarios (miembros mapeados a la planilla).
 * Sin miembros seleccionados, aplica a todos ("Todos" por defecto).
 * Compartido entre /goals (con selector de tarea) y el detalle de tarea
 * (tarea fijada por defaultTaskId).
 */
export function TaskGoalForm({
  tasks,
  defaultTaskId,
  collapsible = false,
  title = "Nuevo objetivo de tarea",
}: TaskGoalFormProps) {
  const [taskId, setTaskId] = useState(defaultTaskId ?? tasks[0]?.id ?? "")
  const [name, setName] = useState("")
  const [target, setTarget] = useState("100")
  const [type, setType] = useState<"daily" | "weekly" | "monthly">("daily")
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [members, setMembers] = useState<TaskSheetMemberWithName[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Carga los usuarios mapeados a la planilla de la tarea seleccionada.
  // El estado de carga es derivado: hay loading mientras loadedFor !== taskId.
  const membersLoading = loadedFor !== taskId

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    getTaskSheetMembersAction(taskId).then((result) => {
      if (cancelled) return
      if (result.ok) setMembers(result.data)
      else toast.error(result.error)
      setLoadedFor(taskId)
    })
    return () => {
      cancelled = true
    }
  }, [taskId])

  function create() {
    startTransition(async () => {
      const result = await createTaskGoalAction({
        taskId,
        name,
        target: Number(target),
        type,
        memberIds: memberIds.length > 0 ? memberIds : undefined,
      })
      if (result.ok) {
        toast.success("Objetivo de planilla creado")
        setName("")
        setTarget("100")
        setMemberIds([])
        if (collapsible) setShowForm(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const showContent = !collapsible || showForm

  return (
    <AppleCard>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-between text-left"
        >
          <AppleCardTitle>{title}</AppleCardTitle>
          <ChevronDownIcon
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", showForm && "rotate-180")}
            aria-hidden
          />
        </button>
      ) : (
        <AppleCardTitle>{title}</AppleCardTitle>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay tareas con planilla vinculada — creá una en{" "}
          <Link href="/tasks" className="font-medium text-primary underline underline-offset-4">
            Tareas
          </Link>{" "}
          pegando la URL de la hoja.
        </p>
      ) : showContent ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {!defaultTaskId ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-goal-task">Tarea</Label>
                <Select
                  value={taskId}
                  onValueChange={(value) => {
                    setTaskId(value ?? "")
                    setMemberIds([])
                  }}
                  items={tasks.map((task) => ({ value: task.id, label: task.title }))}
                >
                  <SelectTrigger id="task-goal-task" aria-label="Tarea" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-goal-name">Nombre</Label>
              <Input
                id="task-goal-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: M6 — 600 tareas"
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-goal-target">Meta (por usuario)</Label>
              <Input
                id="task-goal-target"
                type="number"
                min={1}
                step={1}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-goal-type">Período</Label>
              <Select
                value={type}
                onValueChange={(value) => setType((value as "daily" | "weekly" | "monthly") ?? "daily")}
                items={SHEET_GOAL_TYPES.map((t) => ({ value: t, label: SHEET_GOAL_TYPES_LABELS[t] }))}
              >
                <SelectTrigger id="task-goal-type" aria-label="Período" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHEET_GOAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SHEET_GOAL_TYPES_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Usuarios de la tarea (checkboxes; ninguno marcado = todos) */}
          <div className="flex flex-col gap-1.5">
            <Label>Miembros asignados</Label>
            {membersLoading ? (
              <p className="text-xs text-muted-foreground">Cargando miembros…</p>
            ) : members.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Si no se selecciona ninguno, el objetivo aplica a todos los miembros de la tarea.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  {members.map((m) => (
                    <label key={m.memberId} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={memberIds.includes(m.memberId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMemberIds([...memberIds, m.memberId])
                          } else {
                            setMemberIds(memberIds.filter((id) => id !== m.memberId))
                          }
                        }}
                      />
                      {m.memberName}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Esta tarea no tiene miembros mapeados a la planilla.
              </p>
            )}
          </div>

          <div>
            <Button
              type="button"
              onClick={create}
              disabled={isPending || !name.trim() || !taskId || Number(target) <= 0}
            >
              {isPending ? (
                <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <PlusIcon className="size-4" aria-hidden />
              )}
              Crear objetivo
            </Button>
          </div>
        </div>
      ) : null}
    </AppleCard>
  )
}
