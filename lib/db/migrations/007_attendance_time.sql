-- 007_attendance_time.sql — record the wall-clock time each attendance mark
-- was made, so the panel can show when people arrived. Existing rows get the
-- time portion of their created_at (UTC) as a best effort.

ALTER TABLE attendance ADD COLUMN marked_at TEXT;

UPDATE attendance SET marked_at = substr(created_at, 12, 5) WHERE marked_at IS NULL;
