-- 014_sheet_tasks.sql — Planillas vinculadas a hojas de Google Sheets públicas.
--
-- El supervisor crea una "planilla": pega la URL pública de la hoja (CSV
-- export) y marca qué miembros trabajan ahí (con su usuario en la planilla,
-- ej: ext_leviceco). Un cron baja el CSV periódicamente, traduce los
-- usuarios y guarda conteos diarios por (tarea, miembro, fecha, resultado).
-- Los conteos son acumulativos por fecha: las fechas que dejan de estar en
-- la hoja conservan su histórico.

CREATE TABLE sheet_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_sheet_tasks_user ON sheet_tasks (user_id);

CREATE TABLE sheet_task_members (
  task_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  sheet_user TEXT NOT NULL,
  PRIMARY KEY (task_id, member_id)
);

CREATE TABLE sheet_task_daily_stats (
  task_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  date TEXT NOT NULL,
  result TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (task_id, member_id, date, result)
);

CREATE INDEX idx_sheet_stats_period ON sheet_task_daily_stats (task_id, member_id, date);

-- Objetivos de planilla: una meta por usuario (target) sobre una planilla,
-- con período diario/semanal/mensual. El progreso se calcula sobre los
-- conteos diarios (resultado 'done') dentro del período del tipo elegido.
CREATE TABLE sheet_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sheet_task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_sheet_goals_user ON sheet_goals (user_id);
