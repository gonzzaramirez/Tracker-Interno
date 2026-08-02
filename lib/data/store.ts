/**
 * In-memory server store (decision D1).
 *
 * `getDb()` lazily seeds on the first request for the current process;
 * `resetDb()` re-seeds a clean copy (development only).
 *
 * Data is lost on server restart by design (REQ-CC-002: deterministic seed
 * per process start).
 */

import { createSeed, type Db } from "./seed"

let db: Db | null = null

export function getDb(): Db {
  if (!db) {
    db = createSeed()
  }
  return db
}

export function resetDb(): Db {
  db = createSeed()
  return db
}