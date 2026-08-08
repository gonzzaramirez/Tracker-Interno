-- 019_task_sheet_rows.sql — individual CSV rows from sheet sync.
-- Each row imported from the Google Sheet is stored here to preserve ordering
-- and enable gap (free time) calculations between consecutive tasks.
-- Only rows with TASK_STATUS='done' and a mapped member are stored.

CREATE TABLE task_sheet_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  date TEXT NOT NULL,
  result TEXT NOT NULL,
  timestamp_start TEXT,
  timestamp_end TEXT,
  elapsed_seconds INTEGER,
  sort_order INTEGER NOT NULL
);

CREATE INDEX idx_sheet_rows_lookup ON task_sheet_rows (task_id, member_id, date, sort_order);
