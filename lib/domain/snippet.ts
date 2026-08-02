/**
 * Pure domain types — reusable snippets for team communication.
 */

export type Snippet = {
  id: string
  title: string
  description?: string
  content: string
  tags: string[]
  usageCount: number
  /** ISO date (YYYY-MM-DD) of the last copy. */
  lastUsedAt?: string
}