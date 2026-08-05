-- 008_tracking_evaluations.sql — per-area evaluation snapshots on tracking records.
-- Each row is one evaluated area (of six) for one record: score 1-5, max score
-- and weight. Evaluations are OPTIONAL: a record may carry zero to six areas.
-- Records store a snapshot (pre-filled from the previous record), so deltas
-- between consecutive records show exactly what changed and when.

CREATE TABLE tracking_evaluations (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES tracking_records (id) ON DELETE CASCADE,
  area_id TEXT NOT NULL CHECK (area_id IN (
    'compliance', 'quality', 'communication', 'proactivity', 'teamwork', 'attitude'
  )),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  max_score INTEGER NOT NULL DEFAULT 5 CHECK (max_score >= 1),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1),
  created_at TEXT NOT NULL,
  UNIQUE (record_id, area_id)
);

CREATE INDEX idx_tracking_evaluations_record ON tracking_evaluations (record_id);
