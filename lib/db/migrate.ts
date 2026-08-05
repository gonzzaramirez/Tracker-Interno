/**
 * Migration runner (task 1.4) — applies each `.sql` file in filename order and
 * records it in `schema_migrations`. Each migration has its own transaction and
 * already-applied versions are skipped.
 *
 * Foreign keys are temporarily disabled for the whole run: some migrations
 * rebuild tables (SQLite cannot alter constraints), and `DROP TABLE` on a
 * parent would otherwise fire ON DELETE CASCADE and wipe child rows. This is
 * safe because migrations are trusted, versioned SQL.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { DatabaseSync } from "node:sqlite"

import { MIGRATIONS_DIR } from "./paths"
import type { MigrationRow } from "./schema"

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(
    (db.prepare("SELECT version, applied_at FROM schema_migrations").all() as unknown as MigrationRow[]).map(
      (row) => row.version,
    )
  )

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))

  const mark = db.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)"
  )

  db.exec("PRAGMA foreign_keys = OFF")
  try {
    for (const file of files) {
      if (applied.has(file)) {
        continue
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
      db.exec("BEGIN")
      try {
        db.exec(sql)
        mark.run(file, new Date().toISOString())
        db.exec("COMMIT")
      } catch (error) {
        db.exec("ROLLBACK")
        throw error
      }
    }
  } finally {
    db.exec("PRAGMA foreign_keys = ON")
  }
}
