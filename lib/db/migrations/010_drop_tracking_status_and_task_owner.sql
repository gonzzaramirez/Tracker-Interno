-- 010_drop_tracking_status_and_task_owner.sql — removes two unused columns.
-- 1) tracking_records.status: the user does not use it; the record no longer
--    carries a state, only rating (derived), content and evaluation areas.
-- 2) tasks.member_id: tasks are informational (title + description), but the
--    legacy column is NOT NULL, so inserts without an owner fail.
-- SQLite cannot drop indexed/constrained columns, so both tables are rebuilt.
-- The runner disables foreign keys for the whole run (no cascade on DROP).

CREATE TABLE tracking_records_v3 (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  content_html TEXT NOT NULL,
  record_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_sequence INTEGER NOT NULL,
  updated_at TEXT
);

INSERT INTO tracking_records_v3 (
  id, member_id, rating, content_html, record_date, created_at, created_sequence, updated_at
)
SELECT
  id, member_id, rating, content_html, record_date, created_at, created_sequence, updated_at
FROM tracking_records;

DROP TABLE tracking_records;

ALTER TABLE tracking_records_v3 RENAME TO tracking_records;

CREATE INDEX idx_tracking_member_order
  ON tracking_records (member_id, record_date, created_at, created_sequence);

CREATE INDEX idx_tracking_record_date ON tracking_records (record_date);

CREATE TABLE tasks_v2 (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in-progress', 'done')),
  due_date TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO tasks_v2 (id, title, description, priority, status, due_date, created_at)
SELECT id, title, description, priority, status, due_date, created_at FROM tasks;

DROP TABLE tasks;

ALTER TABLE tasks_v2 RENAME TO tasks;

CREATE INDEX idx_tasks_due ON tasks (due_date);
