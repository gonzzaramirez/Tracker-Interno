/**
 * Mock snippets repo — async read/write access to the in-memory store.
 */

import type { Snippet } from "@/lib/domain"

import { getDb } from "./store"
import { delay } from "./delay"

export async function listSnippets(): Promise<Snippet[]> {
  await delay()
  return [...getDb().snippets]
}

export async function insertSnippet(snippet: Snippet): Promise<Snippet> {
  await delay()
  getDb().snippets.push(snippet)
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
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  db.snippets[index] = {
    ...db.snippets[index],
    usageCount: db.snippets[index].usageCount + 1,
    lastUsedAt: `${year}-${month}-${day}`,
  }
  return db.snippets[index]
}