import { queryOne } from "../query"

type SequenceTable = "tracking_records"

type SequenceRow = {
  next_sequence: number
}

/** Allocate a per-table insertion sequence for deterministic same-day ordering. */
export async function nextSequence(table: SequenceTable): Promise<number> {
  const row = await queryOne<SequenceRow>(
    `SELECT COALESCE(MAX(created_sequence), 0) + 1 AS next_sequence FROM ${table}`,
  )
  return row?.next_sequence ?? 1
}
