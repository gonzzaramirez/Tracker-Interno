/**
 * Snippets repository (task 1.5) — raw SQL over the shared connection.
 */
import { randomUUID } from "node:crypto"

import { getDb } from "../connection"
import type { SnippetRow } from "../schema"
import type { Snippet } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"
import { nextSequence } from "./sequence"

function toSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    content: row.content,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at ?? undefined,
  }
}

export type NewSnippet = Omit<Snippet, "id" | "usageCount" | "lastUsedAt">

export async function listSnippets(): Promise<Snippet[]> {
  const rows = getDb()
    .prepare("SELECT * FROM snippets ORDER BY created_at DESC, created_sequence DESC, id DESC")
    .all() as SnippetRow[]
  return rows.map(toSnippet)
}

export async function insertSnippet(input: NewSnippet): Promise<Snippet> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const db = getDb()
  const createdSequence = nextSequence(db, "snippets")
  db
    .prepare(
      `INSERT INTO snippets
       (id, title, description, content, usage_count, created_at, created_sequence)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    )
    .run(id, input.title, input.description ?? null, input.content, createdAt, createdSequence)
  const row = db.prepare("SELECT * FROM snippets WHERE id = ?").get(id) as
    | SnippetRow
    | undefined
  if (!row) {
    throw new Error(`Snippet ${id} could not be read after insert.`)
  }
  return toSnippet(row)
}

/** Increments usage_count and stamps last_used_at, returns the updated row. */
export async function touchSnippet(id: string): Promise<Snippet | undefined> {
  const today = todayISO()
  const result = getDb()
    .prepare(
      `UPDATE snippets
       SET usage_count = usage_count + 1, last_used_at = ?
       WHERE id = ?`
    )
    .run(today, id)

  if (result.changes === 0) {
    return undefined
  }
  const row = getDb().prepare("SELECT * FROM snippets WHERE id = ?").get(id) as
    | SnippetRow
    | undefined
  return row ? toSnippet(row) : undefined
}
