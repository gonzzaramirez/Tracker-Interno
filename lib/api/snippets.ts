/**
 * FUTURE HTTP contract for the snippet-library capability (task 1.5).
 *
 * DEFINED but NEVER invoked — documents the swap shape only (REQ-CC-001).
 */

import type { Snippet } from "@/lib/domain"

export type CreateSnippetInput = {
  title: string
  description?: string
  content: string
}

export interface SnippetsApi {
  getSnippets: () => Promise<Snippet[]>
  createSnippet: (input: CreateSnippetInput) => Promise<Snippet>
  registerUsage: (id: string) => Promise<Snippet>
}

export const snippetsApi: SnippetsApi = {
  async getSnippets() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async createSnippet() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
  async registerUsage() {
    throw new Error("HTTP contract not wired yet — swap lib/data binding here")
  },
}
