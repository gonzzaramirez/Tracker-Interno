/**
 * Mock snippets repo — async read/write access to the in-memory store.
 */

import type { Snippet } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"
import { todayISO } from "./date"

export async function listSnippets(): Promise<Snippet[]> {
  await delay()
  return [...getDb().snippets]
}

export async function insertSnippet(
  input: Omit<Snippet, "id" | "usageCount" | "lastUsedAt">
): Promise<Snippet> {
  await delay()
  const db = getDb()
  const snippet: Snippet = {
    ...input,
    id: `sn-${db.counters.snippet}`,
    usageCount: 0,
  }
  db.counters.snippet += 1
  db.snippets.push(snippet)
  return snippet
}

/** Increments usageCount and stamps lastUsedAt, returns the updated snippet. */
export async function touchSnippet(id: string): Promise<Snippet | undefined> {
  await delay()
  const db = getDb()
  const index = db.snippets.findIndex((snippet) => snippet.id === id)
  if (index === -1) {
    return undefined
  }
  db.snippets[index] = {
    ...db.snippets[index],
    usageCount: db.snippets[index].usageCount + 1,
    lastUsedAt: todayISO(),
  }
  return db.snippets[index]
}