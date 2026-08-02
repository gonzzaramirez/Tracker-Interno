/**
 * Snippet library use cases (task 6.1).
 */

import type { Snippet } from "@/lib/domain"
import { insertSnippet, listSnippets, touchSnippet } from "@/lib/data/snippets"

export type CreateSnippetInput = {
  title: string
  content: string
  description?: string
  tags: string[]
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 6)
}

/** All snippets, most-used first (REQ-SL-001). */
export async function getSnippets(): Promise<Snippet[]> {
  const snippets = await listSnippets()
  return snippets.sort((a, b) => {
    if (a.usageCount !== b.usageCount) {
      return b.usageCount - a.usageCount
    }
    return b.lastUsedAt?.localeCompare(a.lastUsedAt ?? "") ?? 0
  })
}

/** Snippets with at least one copy, ordered by last use (REQ-SL-003). */
export async function getUsedSnippets(): Promise<Snippet[]> {
  const snippets = await listSnippets()
  return snippets
    .filter((snippet) => snippet.usageCount > 0)
    .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))
}

export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
  if (!input.title.trim()) {
    throw new Error("Title is required.")
  }
  if (!input.content.trim()) {
    throw new Error("Snippet content is required.")
  }
  return insertSnippet({
    title: input.title.trim(),
    content: input.content.trim(),
    description: input.description?.trim() || undefined,
    tags: normalizeTags(input.tags),
  })
}

/** Marks a snippet as used (copy) and returns it (REQ-SL-002). */
export async function markSnippetUsed(id: string): Promise<Snippet> {
  const updated = await touchSnippet(id)
  if (!updated) {
    throw new Error("Snippet not found.")
  }
  return updated
}