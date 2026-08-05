-- 006_attendance.sql — daily attendance (who showed up and is active today).
-- One row per member per day: presence is recorded explicitly; absence is
-- simply the lack of a row. The owner marks people from the dashboard.

CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (member_id, date)
);

CREATE INDEX idx_attendance_date ON attendance (date);
