/**
 * SQLite connection singleton (async, via @libsql/client).
 *
 * Uses one client per process, guarded through `globalThis`. The first
 * initialization applies pending migrations and ensures the default
 * supervisor (gonza) exists. No demo data is ever inserted.
 *
 * - Local dev: `file:` URL over the native binding (data/tracker.db)
 * - Vercel/Turso: remote libsql:// URL (pure-JS hrana over HTTP)
 */
import { mkdirSync } from "node:fs"
import { createClient, type Client } from "@libsql/client"

import { migrate } from "./migrate"
import { DB_DIR, DB_PATH } from "./paths"
import { hashPassword } from "../auth-password"

const globalForTracker = globalThis as typeof globalThis & {
  __trackerDatabase?: Promise<Client>
}

function clientConfig(): { url: string; authToken?: string } {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }
  }
  mkdirSync(DB_DIR, { recursive: true })
  return { url: `file:${DB_PATH}` }
}

/** Default supervisor created on an empty users table (production-ready). */
const DEFAULT_USER = {
  id: "user-gonza",
  username: "gonza",
  password: "gonza",
}

/** Dedicated Project Manager account (cross-tenant, read-only views). */
const DEFAULT_PM = {
  id: "user-admin",
  username: "admin",
  password: "admin",
}

async function ensureDefaultUser(client: Client): Promise<void> {
  const result = await client.execute("SELECT COUNT(*) AS n FROM users")
  const n = Number((result.rows[0] as unknown as { n: number }).n)
  if (n !== 0) return
  const hash = hashPassword(DEFAULT_USER.password)
  await client.execute({
    sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    args: [DEFAULT_USER.id, DEFAULT_USER.username, hash, new Date().toISOString()],
  })
}

/**
 * Idempotent PM seed. The PM is the first privileged cross-tenant account,
 * so it is NEVER auto-seeded in production with default credentials:
 * production must opt in with SEED_DEFAULT_PM=true and should provide a
 * real password via PM_INITIAL_PASSWORD. Dev seeds pm/pm for convenience.
 */
async function ensureDefaultPm(client: Client): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.SEED_DEFAULT_PM !== "true") return
  const password = process.env.PM_INITIAL_PASSWORD || DEFAULT_PM.password
  if (password === DEFAULT_PM.password) {
    console.warn(
      "[tracker] PM account seeded with the DEFAULT password — set PM_INITIAL_PASSWORD (and change it after first login).",
    )
  }
  const hash = hashPassword(password)
  await client.execute({
    sql: "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, 'pm', ?) ON CONFLICT (username) DO NOTHING",
    args: [DEFAULT_PM.id, DEFAULT_PM.username, hash, new Date().toISOString()],
  })
}

async function init(): Promise<Client> {
  const client = createClient(clientConfig())
  try {
    await migrate(client)
    await ensureDefaultUser(client)
    await ensureDefaultPm(client)
    return client
  } catch (error) {
    client.close()
    throw error
  }
}

/** Shared client for the current process (async init runs exactly once). */
export function getDb(): Promise<Client> {
  if (!globalForTracker.__trackerDatabase) {
    globalForTracker.__trackerDatabase = init()
  }
  return globalForTracker.__trackerDatabase
}

export { DB_PATH }
