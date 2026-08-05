-- 011_multi_tenant.sql — adds per-supervisor isolation (user_id) to every
-- app table so each supervisor sees only their own data. A new `users` table
-- holds login credentials; an application-level check ensures at least one
-- admin user exists on first start.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Add user_id to every active table with a default so existing rows are
-- assigned to the admin that will be created on next cold start.

ALTER TABLE members ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE tracking_records ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE tracking_tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE tracking_evaluations ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE time_off ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';
ALTER TABLE attendance ADD COLUMN user_id TEXT NOT NULL DEFAULT 'user-admin';

-- Legacy / unused tables get a nullable column to keep migrations idempotent.
ALTER TABLE feedback ADD COLUMN user_id TEXT;
ALTER TABLE check_ins ADD COLUMN user_id TEXT;
ALTER TABLE task_progress ADD COLUMN user_id TEXT;
ALTER TABLE snippets ADD COLUMN user_id TEXT;

-- Indexes for the most common query pattern: everything filtered by tenant.
CREATE INDEX idx_members_user ON members (user_id);
CREATE INDEX idx_tracking_user ON tracking_records (user_id);
CREATE INDEX idx_tracking_tasks_user ON tracking_tasks (user_id);
CREATE INDEX idx_tracking_evals_user ON tracking_evaluations (user_id);
CREATE INDEX idx_tasks_user ON tasks (user_id);
CREATE INDEX idx_timeoff_user ON time_off (user_id);
CREATE INDEX idx_attendance_user ON attendance (user_id);
