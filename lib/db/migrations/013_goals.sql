-- 013_goals.sql — Objetivos por tarea por miembro.
--
-- Los objetivos miden "tareas completadas" dentro de un período (diario,
-- semanal, mensual o rango personalizado). Para eso las tareas necesitan
-- registrar CUÁNDO se completaron; se agrega tasks.completed_at.
--
-- La tabla `goals` es por tenant (user_id = supervisor). Un objetivo puede
-- apuntar a una tarea puntual (task_id) o ser general (task_id NULL) y a un
-- miembro (member_id). El progreso se calcula contando tareas con status
-- 'done' y completed_at dentro de [start_date, end_date].

ALTER TABLE tasks ADD COLUMN completed_at TEXT;
CREATE INDEX idx_tasks_completed ON tasks (user_id, completed_at);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  task_id TEXT,
  metric TEXT NOT NULL DEFAULT 'tasks-completed',
  target INTEGER NOT NULL CHECK (target > 0),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'custom')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX idx_goals_member ON goals (user_id, member_id, status);
CREATE INDEX idx_goals_period ON goals (user_id, start_date, end_date);
