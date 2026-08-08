-- 017_sync_error.sql — last sync failure per task, surfaced by the UI.
-- The message is stored as-is (no user data) and cleared on the next OK sync.

ALTER TABLE tasks ADD COLUMN last_sync_error TEXT;
