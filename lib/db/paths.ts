import path from "node:path"

/** Stable paths shared by the connection, migration runner and dev scripts. */
export const DB_DIR = path.resolve(process.cwd(), "data")
export const DB_PATH = path.join(DB_DIR, "tracker.db")
export const MIGRATIONS_DIR = path.resolve(process.cwd(), "lib", "db", "migrations")
