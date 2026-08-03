-- 003_snippet_usage_order.sql — preserve same-day snippet usage order.
-- Kept separate so databases that already applied migration 002 can upgrade.

ALTER TABLE snippets ADD COLUMN last_used_sequence INTEGER;

UPDATE snippets
SET last_used_at = last_used_at || 'T00:00:00.000Z'
WHERE last_used_at IS NOT NULL AND instr(last_used_at, 'T') = 0;

UPDATE snippets
SET last_used_sequence = COALESCE(created_sequence, rowid)
WHERE last_used_at IS NOT NULL AND last_used_sequence IS NULL;

CREATE INDEX idx_snippets_usage_order
  ON snippets (last_used_at, last_used_sequence);
