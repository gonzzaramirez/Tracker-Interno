-- Member CRUD (task: member management) — search indexes.
-- Members are searched by name/role from the roster page; case-insensitive
-- LIKE queries use these indexes.
CREATE INDEX idx_members_name ON members (name COLLATE NOCASE);
CREATE INDEX idx_members_role ON members (role COLLATE NOCASE);
