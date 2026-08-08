-- 013_pm_roles.sql — Project Manager role and supervisor cell names.
--
-- Until now every login account was a supervisor (tenant) by definition.
-- The PM is a dedicated account with role='pm' that reads across tenants
-- (read-only). celula lets each supervisor name their cell so the PM can
-- see, e.g. "Gonzalo Ramirez — Celula 5 — 14 miembros".

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'supervisor';
ALTER TABLE users ADD COLUMN celula TEXT;

CREATE INDEX idx_users_role ON users (role);
