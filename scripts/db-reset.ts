import { mkdirSync, rmSync } from "node:fs"
import { createClient } from "@libsql/client"

import { DB_DIR, DB_PATH } from "../lib/db/paths"
import { migrate } from "../lib/db/migrate"
import { seedIfEmpty } from "../lib/db/seed"

async function main() {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${DB_PATH}${suffix}`, { force: true })
  }
  mkdirSync(DB_DIR, { recursive: true })

  const client = createClient({ url: `file:${DB_PATH}` })
  try {
    await migrate(client)
    const seeded = await seedIfEmpty(client)
    console.log(`Database reset at ${DB_PATH} (${DB_DIR}); seed applied: ${seeded}`)
  } finally {
    client.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
