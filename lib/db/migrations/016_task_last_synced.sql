-- 016_task_last_synced.sql — frescura del sync por tarea.
-- La UI muestra cuándo se importó la hoja por última vez.

ALTER TABLE tasks ADD COLUMN last_synced_at TEXT;
