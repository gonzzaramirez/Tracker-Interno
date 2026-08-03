import type { DatabaseSync } from "node:sqlite"

type SequenceTable = "task_progress" | "feedback" | "snippets"

type SequenceRow = {
  next_sequence: number
}

/** Allocate a per-table insertion sequence for deterministic same-day ordering. */
export function nextSequence(db: DatabaseSync, table: SequenceTable): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(created_sequence), 0) + 1 AS next_sequence FROM ${table}`)
    .get() as SequenceRow
  return row.next_sequence
}
