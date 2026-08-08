-- 015_sheet_in_tasks.sql — la importación de Google Sheets vive dentro de Tareas.
--
-- Una tarea puede tener una hoja pública vinculada: tasks.sheet_url + el
-- mapeo miembro ↔ usuario en la planilla (task_sheet_members). El cron baja
-- el CSV y guarda conteos diarios por (tarea, miembro, fecha, resultado) en
-- task_daily_stats. Los objetivos de planilla pasan a ser task_goals.
-- Las tablas de la feature anterior "planillas" (014) se renombran/dropan:
-- el dev DB no tenía datos en ellas (feature sin usar).

ALTER TABLE tasks ADD COLUMN sheet_url TEXT;

CREATE TABLE task_sheet_members (
  task_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  sheet_user TEXT NOT NULL,
  PRIMARY KEY (task_id, member_id)
);

ALTER TABLE sheet_task_daily_stats RENAME TO task_daily_stats;
DROP INDEX IF EXISTS idx_sheet_stats_period;
CREATE INDEX idx_task_stats_period ON task_daily_stats (task_id, member_id, date);

ALTER TABLE sheet_goals RENAME TO task_goals;
ALTER TABLE task_goals RENAME COLUMN sheet_task_id TO task_id;

DROP TABLE sheet_tasks;
DROP TABLE sheet_task_members;
