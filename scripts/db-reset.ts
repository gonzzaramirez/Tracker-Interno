import { rmSync } from "node:fs"

import { DB_PATH } from "../lib/db/paths"
import { getDb } from "../lib/db/connection"

/**
 * Reset the LOCAL database: deletes the file (schema + data) and re-runs
 * migrations + default user creation on next access.
 */
async function main() {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${DB_PATH}${suffix}`, { force: true })
  }
  await getDb() // re-initializes: migrations + default user (gonza)
  console.log(`Database reset at ${DB_PATH} — schema only, no demo data.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
