-- 002_stable_tracking_order.sql — preserve insertion order for same-day records.
-- Existing databases receive nullable columns and deterministic backfills. New
-- writes always provide both timestamp and sequence values from repositories.

ALTER TABLE task_progress ADD COLUMN created_at TEXT;
ALTER TABLE task_progress ADD COLUMN created_sequence INTEGER;
ALTER TABLE feedback ADD COLUMN created_sequence INTEGER;
ALTER TABLE snippets ADD COLUMN created_sequence INTEGER;

UPDATE task_progress
SET created_at = progress_date || 'T00:00:00.000Z',
    created_sequence = rowid
WHERE created_at IS NULL OR created_sequence IS NULL;

UPDATE feedback
SET created_sequence = rowid
WHERE created_sequence IS NULL;

UPDATE snippets
SET created_sequence = rowid
WHERE created_sequence IS NULL;

CREATE INDEX idx_progress_created_order
  ON task_progress (task_id, progress_date, created_at, created_sequence);

CREATE INDEX idx_feedback_created_order
  ON feedback (member_id, created_at, created_sequence);

CREATE INDEX idx_snippets_created_order
  ON snippets (created_at, created_sequence);
