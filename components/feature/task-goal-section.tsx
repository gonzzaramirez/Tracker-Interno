import { TaskGoalForm } from "@/components/feature/task-goal-form"
import { TaskGoalList } from "@/components/feature/task-goal-list"
import type { Task } from "@/lib/domain"
import type { TaskGoalView } from "@/lib/services/task-sheets"

type TaskGoalSectionProps = {
  /** Tareas con planilla vinculada (para el selector del form de creación). */
  tasks: Task[]
  views: TaskGoalView[]
}

/**
 * Sección principal "Objetivos de planillas": header descriptivo + lista
 * agrupada por tarea → período + form de creación de objetivos de tarea.
 * El objetivo pertenece a una TAREA y ahí se agregan 1 o más usuarios.
 */
export function TaskGoalSection({ tasks, views }: TaskGoalSectionProps) {
  return (
    <section aria-labelledby="task-goals-heading" className="space-y-4">
      <div>
        <h2 id="task-goals-heading" className="text-base font-semibold tracking-tight text-foreground">
          Objetivos de planillas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Metas por usuario sobre las tareas importadas — el progreso se actualiza solo con cada sync.
        </p>
      </div>

      <TaskGoalList views={views} />

      <TaskGoalForm tasks={tasks} title="Crear objetivo de tarea" />
    </section>
  )
}
