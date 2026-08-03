-- 001_init.sql — initial schema (task 1.2, design D1/D3/D6).
-- Dates are TEXT ISO `YYYY-MM-DD` (D3). Enums are CHECK constraints + TS
-- arrays in lib/db/schema.ts (single source of truth).

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  display_color TEXT NOT NULL DEFAULT '#0a84ff',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recess')),
  joined_at TEXT NOT NULL,
  notes TEXT,
  checkin_freq_days INTEGER NOT NULL DEFAULT 30 CHECK (checkin_freq_days > 0),
  last_checkin_at TEXT,
  next_checkin_at TEXT NOT NULL
);

CREATE INDEX idx_members_next_checkin ON members (next_checkin_at);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in-progress', 'done')),
  due_date TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_tasks_member ON tasks (member_id);
CREATE INDEX idx_tasks_due ON tasks (due_date);

CREATE TABLE task_progress (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  progress_date TEXT NOT NULL,
  note TEXT
);

CREATE INDEX idx_progress_task_date ON task_progress (task_id, progress_date);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('praise', 'coaching', 'concern')),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_feedback_member_date ON feedback (member_id, created_at);

CREATE TABLE snippets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_snippets_title ON snippets (title);

CREATE TABLE time_off (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'license', 'sickness', 'holiday')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  created_at TEXT NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_timeoff_member ON time_off (member_id);
CREATE INDEX idx_timeoff_start ON time_off (start_date);

CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  checkin_date TEXT NOT NULL,
  semaphore TEXT CHECK (semaphore IN ('green', 'yellow', 'red')),
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_checkins_member_date ON check_ins (member_id, checkin_date DESC);
