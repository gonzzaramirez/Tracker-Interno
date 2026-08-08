-- 020_gap_stats.sql — gap (free time) metrics for "done" aggregate stat rows.
-- Gaps are computed per (member, date) from consecutive task_sheet_rows,
-- measuring the idle time between one task ending and the next starting.
-- Only applies to rows where result = 'done'.

ALTER TABLE task_daily_stats ADD COLUMN total_gap_seconds INTEGER DEFAULT 0;
ALTER TABLE task_daily_stats ADD COLUMN max_gap_seconds INTEGER DEFAULT 0;
ALTER TABLE task_daily_stats ADD COLUMN gap_count INTEGER DEFAULT 0;
ALTER TABLE task_daily_stats ADD COLUMN coverage_start TEXT;
ALTER TABLE task_daily_stats ADD COLUMN coverage_end TEXT;
