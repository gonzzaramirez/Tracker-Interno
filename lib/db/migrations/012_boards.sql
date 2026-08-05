-- 012_boards.sql — Excalidraw whiteboards per tenant.
-- Each board stores its full scene (elements + appState + files) as JSON so
-- the editor can save and restore without extra round-trips. The list view
-- only reads metadata columns, never the scene payload.

CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scene_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_boards_user_updated ON boards (user_id, updated_at DESC);
