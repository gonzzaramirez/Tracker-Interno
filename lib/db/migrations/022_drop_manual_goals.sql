-- 022_drop_manual_goals.sql — Elimina el seguimiento manual (tabla `goals`).
--
-- El modelo de objetivos ahora es SOLO por planilla (task_goals). La tabla
-- `goals` de la migration 013 quedó en desuso y se dropea, junto con sus
-- índices. NO se toca tasks.completed_at (013) ni idx_tasks_completed: siguen
-- usándose para marcar tareas done.

DROP INDEX IF EXISTS idx_goals_period;
DROP INDEX IF EXISTS idx_goals_member;
DROP TABLE IF EXISTS goals;
