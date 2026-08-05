-- 009_tracking_rating_nullable.sql — rating becomes derived from the
-- evaluation areas (weighted average), so it must be nullable: NULL means the
-- record has no scored areas. SQLite cannot alter column constraints, so the
-- table is rebuilt. Indexes are recreated. The runner disables foreign keys
-- for the whole run so the DROP does not cascade into child rows.

CREATE TABLE tracking_records_v2 (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  status TEXT NOT NULL CHECK (status IN ('advancing', 'stable', 'at-risk')),
  content_html TEXT NOT NULL,
  record_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_sequence INTEGER NOT NULL,
  updated_at TEXT
);

INSERT INTO tracking_records_v2 (
  id, member_id, rating, status, content_html, record_date, created_at,
  created_sequence, updated_at
)
SELECT
  id, member_id, rating, status, content_html, record_date, created_at,
  created_sequence, updated_at
FROM tracking_records;

DROP TABLE tracking_records;

ALTER TABLE tracking_records_v2 RENAME TO tracking_records;

CREATE INDEX idx_tracking_member_order
  ON tracking_records (member_id, record_date, created_at, created_sequence);

CREATE INDEX idx_tracking_record_date ON tracking_records (record_date);
