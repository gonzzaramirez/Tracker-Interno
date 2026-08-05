-- 005_tracking.sql — tracking records (the core of the platform).
-- Each record is a follow-up entry for a member: rating 1-5, status,
-- rich-text comment (Tiptap HTML), date, plus linked tasks with progress.
-- Old tables (tasks, task_progress, feedback, snippets, check_ins) are kept
-- intact; the app stops using them. Feedback rows are migrated over.

CREATE TABLE tracking_records (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL CHECK (status IN ('advancing', 'stable', 'at-risk')),
  content_html TEXT NOT NULL,
  record_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_sequence INTEGER NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_tracking_member_order
  ON tracking_records (member_id, record_date, created_at, created_sequence);

CREATE INDEX idx_tracking_record_date ON tracking_records (record_date);

CREATE TABLE tracking_tasks (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES tracking_records (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_tracking_tasks_record ON tracking_tasks (record_id);

-- Migrate existing feedback into tracking records. Content becomes a simple
-- <p> paragraph; the escape keeps it safe when rendered as HTML.
INSERT INTO tracking_records (
  id, member_id, rating, status, content_html, record_date, created_at,
  created_sequence
)
SELECT
  'tr-' || feedback.id,
  member_id,
  rating,
  'stable',
  '<p>' || replace(replace(replace(replace(content, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;') || '</p>',
  substr(created_at, 1, 10),
  created_at,
  created_sequence
FROM feedback;

-- Link each migrated record to the most recently completed task of the same
-- member (if any) at 100% progress, so history is not empty.
INSERT INTO tracking_tasks (id, record_id, title, description, progress, created_at)
SELECT
  'tt-' || tr.id,
  tr.id,
  t.title,
  t.description,
  100,
  tr.created_at
FROM tracking_records tr
JOIN feedback fb ON 'tr-' || fb.id = tr.id
JOIN tasks t ON t.member_id = tr.member_id AND t.status = 'done'
WHERE t.created_at <= tr.record_date
  AND NOT EXISTS (
    SELECT 1 FROM tracking_tasks tt WHERE tt.record_id = tr.id
  );
