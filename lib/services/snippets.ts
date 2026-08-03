/** Snippet library use cases over the SQLite repository. */

import { cache } from "react"

import type { Snippet } from "@/lib/domain"
import { insertSnippet, listSnippets, touchSnippet } from "@/lib/db/repos/snippets"

const readSnippets = cache(listSnippets)

export type CreateSnippetInput = {
  title: string
  content: string
  description?: string
}

export async function getSnippets(): Promise<Snippet[]> {
  // The repository orders by the persistent creation timestamp/sequence so a
  // newly created snippet appears first, as required by SL-003.
  return [...(await readSnippets())]
}

export async function getUsedSnippets(): Promise<Snippet[]> {
  const snippets = await readSnippets()
  return snippets
    .filter((snippet) => snippet.usageCount > 0)
    .sort((a, b) => {
      const dateOrder = (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")
      return dateOrder !== 0 ? dateOrder : b.lastUsedSequence - a.lastUsedSequence
    })
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
  })
}

export async function markSnippetUsed(id: string): Promise<Snippet> {
  const updated = await touchSnippet(id)
  if (!updated) {
    throw new Error("Snippet not found.")
  }
  return updated
}
