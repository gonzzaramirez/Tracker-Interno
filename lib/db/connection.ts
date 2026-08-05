/**
 * SQLite connection singleton (decision D4, task 1.1).
 *
 * A single `DatabaseSync` handle per process, guarded through `globalThis` so
 * Fast Refresh / re-renders never open a second connection. The first
 * initialization applies pending migrations, ensures at least one admin user
 * exists (req. for multi-tenancy) and seeds a demo dataset only when the
 * database is empty.
 */
import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"

import { migrate } from "./migrate"
import { DB_DIR, DB_PATH } from "./paths"
import { seedIfEmpty } from "./seed"
import { hashPassword } from "../auth-password"

/** Smallest stable namespace that survives HMR without leaking into requests. */
const globalForTracker = globalThis as typeof globalThis & {
  __trackerDatabase?: DatabaseSync
}

function openDatabase(): DatabaseSync {
  mkdirSync(DB_DIR, { recursive: true })
  const db = new DatabaseSync(DB_PATH, {
    enableForeignKeyConstraints: true,
    timeout: 5000,
  })
  db.exec("PRAGMA journal_mode = WAL")
  db.exec("PRAGMA foreign_keys = ON")
  return db
}

/** Idempotent: inserts the default admin user only when the users table is empty. */
function ensureDefaultUser(db: DatabaseSync): void {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }
  if (count.n !== 0) return
  const hash = hashPassword("admin")
  db.prepare(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
  ).run("user-admin", "admin", hash, new Date().toISOString())
}

/**
 * Shared connection for the current process. Applies migrations on first
 * open, then ensures the admin user is ready, and finally seeds the demo
 * dataset when the store is empty.
 */
export function getDb(): DatabaseSync {
  if (globalForTracker.__trackerDatabase) {
    return globalForTracker.__trackerDatabase
  }

  const db = openDatabase()
  try {
    migrate(db)
    ensureDefaultUser(db)
    seedIfEmpty(db)
    globalForTracker.__trackerDatabase = db
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export { DB_PATH }
