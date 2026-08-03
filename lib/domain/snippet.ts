/**
 * Pure domain types — reusable snippets for team communication.
 */

export type Snippet = {
  id: string
  title: string
  description?: string
  content: string
  usageCount: number
  /** ISO date (YYYY-MM-DD) of the last copy. */
  lastUsedAt?: string
  /** Persistent usage sequence used to order copies made on the same date. */
  lastUsedSequence: number
}
