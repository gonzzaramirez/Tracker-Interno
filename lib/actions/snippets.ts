"use server"

/**
 * Snippet Server Actions (task 6.2) — SQLite mutations with a revalidate of
 * the library and dashboard pages (REQ-CC-002).
 */

import { revalidatePath } from "next/cache"

import type { Snippet } from "@/lib/domain"
import { createSnippet, markSnippetUsed, type CreateSnippetInput } from "@/lib/services/snippets"
import { runActionResult, type ActionResult } from "@/lib/actions/result"

export async function createSnippetAction(
  input: CreateSnippetInput
): Promise<ActionResult<Snippet>> {
  const result = await runActionResult(() => createSnippet(input))
  if (result.ok) {
    revalidatePath("/snippets")
    revalidatePath("/")
  }
  return result
}

export async function markSnippetUsedAction(id: string): Promise<ActionResult<Snippet>> {
  const result = await runActionResult(() => markSnippetUsed(id))
  if (result.ok) {
    revalidatePath("/snippets")
    revalidatePath("/")
  }
  return result
}
