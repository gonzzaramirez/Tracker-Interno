/**
 * Typed query helpers over the shared client — the only data-access surface
 * repositories use. Keeps every repo uniform and async-safe.
 */
import type { Client, InValue } from "@libsql/client"

import { getDb } from "./connection"

export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const { rows } = await (await getDb()).execute({ sql, args })
  return rows as unknown as T[]
}

export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  const { rows } = await (await getDb()).execute({ sql, args })
  return rows[0] as unknown as T | undefined
}

/** Runs a write statement; returns the number of affected rows. */
export async function mutate(sql: string, args: InValue[] = []): Promise<number> {
  const result = await (await getDb()).execute({ sql, args })
  return Number(result.rowsAffected)
}

export type { Client }
