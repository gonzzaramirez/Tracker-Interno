-- 018_elapsed_time.sql — elapsed time metrics per stat row.
-- TIMESTAMP_START / TIMESTAMP_END from the Google Sheet CSV are parsed
-- during sync to compute per-day per-member time spent on classified rows.
-- Only rows with TASK_STATUS='done' and valid timestamp pairs contribute.

ALTER TABLE task_daily_stats ADD COLUMN avg_elapsed_seconds INTEGER;
ALTER TABLE task_daily_stats ADD COLUMN min_elapsed_seconds INTEGER;
ALTER TABLE task_daily_stats ADD COLUMN max_elapsed_seconds INTEGER;
ALTER TABLE task_daily_stats ADD COLUMN rows_with_elapsed INTEGER DEFAULT 0;
