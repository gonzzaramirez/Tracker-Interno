import { mkdirSync, rmSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"

import { DB_DIR, DB_PATH } from "../lib/db/paths"
import { migrate } from "../lib/db/migrate"
import { seedIfEmpty } from "../lib/db/seed"

for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`${DB_PATH}${suffix}`, { force: true })
}

mkdirSync(DB_DIR, { recursive: true })
const db = new DatabaseSync(DB_PATH)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA foreign_keys = ON")

try {
  migrate(db)
  const seeded = seedIfEmpty(db)
  console.log(`Database reset at ${DB_PATH} (${DB_DIR}); seed applied: ${seeded}`)
} finally {
  db.close()
}
