/**
 * Migration runner — applies each `.sql` file in filename order and records it
 * in `schema_migrations`. Each migration runs inside its own write
 * transaction; already-applied versions are skipped.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Client } from "@libsql/client"

import { MIGRATIONS_DIR } from "./paths"

export async function migrate(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const result = await client.execute("SELECT version FROM schema_migrations")
  const applied = new Set(result.rows.map((row) => String(row.version)))

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
    const tx = await client.transaction("write")
    try {
      await tx.executeMultiple(sql)
      await tx.execute({
        sql: "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        args: [file, new Date().toISOString()],
      })
      await tx.commit()
    } catch (error) {
      await tx.rollback()
      throw error
    }
  }
}
