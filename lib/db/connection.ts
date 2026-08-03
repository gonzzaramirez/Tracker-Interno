/**
 * SQLite connection singleton (decision D4, task 1.1).
 *
 * A single `DatabaseSync` handle per process, guarded through `globalThis` so
 * Fast Refresh / re-renders never open a second connection. The first
 * initialization applies pending migrations and seeds a demo dataset only when
 * the database is empty (REQ-CC-002).
 *
 * `node:sqlite` is Node's native module. This server-side module and the
 * repositories are the only application code that touch it; app/components
 * must never import this layer.
 */
import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"

import { migrate } from "./migrate"
import { DB_DIR, DB_PATH } from "./paths"
import { seedIfEmpty } from "./seed"

/** Smallest stable namespace that survives HMR without leaking into requests. */
const globalForTracker = globalThis as typeof globalThis & {
  __trackerDatabase?: DatabaseSync
}

function openDatabase(): DatabaseSync {
  mkdirSync(DB_DIR, { recursive: true })
  const db = new DatabaseSync(DB_PATH)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec("PRAGMA foreign_keys = ON")
  return db
}

/**
 * Shared connection for the current process. Applies migrations on first
 * open, then seeds the demo dataset when the store is empty (D6).
 */
export function getDb(): DatabaseSync {
  if (globalForTracker.__trackerDatabase) {
    return globalForTracker.__trackerDatabase
  }

  const db = openDatabase()
  try {
    migrate(db)
    seedIfEmpty(db)
    globalForTracker.__trackerDatabase = db
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export { DB_PATH }
