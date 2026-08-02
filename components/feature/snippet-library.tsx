"use client"

import { useMemo, useState, useTransition } from "react"
import { CheckIcon, ClipboardIcon, InboxIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { markSnippetUsedAction } from "@/lib/actions/snippets"
import type { Snippet } from "@/lib/domain"

function formatLastUsed(dateISO?: string): string {
  if (!dateISO) {
    return "never used"
  }
  return `last used ${dateISO}`
}

type SnippetCardProps = {
  snippet: Snippet
}

function SnippetCard({ snippet }: SnippetCardProps) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      startTransition(async () => {
        await markSnippetUsedAction(snippet.id)
      })
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy — clipboard unavailable")
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{snippet.title}</h3>
          {snippet.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{snippet.description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          disabled={isPending}
        >
          {copied ? <CheckIcon className="size-3.5 text-green-600" /> : <ClipboardIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <pre className="max-h-40 overflow-auto rounded-xl bg-background px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">
        {snippet.content}
      </pre>

      <div className="flex flex-wrap items-center gap-2">
        {snippet.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="capitalize">
            {tag}
          </Badge>
        ))}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {snippet.usageCount} use{snippet.usageCount === 1 ? "" : "s"} ·{" "}
          {formatLastUsed(snippet.lastUsedAt)}
        </span>
      </div>
    </div>
  )
}

type SnippetLibraryProps = {
  snippets: Snippet[]
}

/**
 * Client-side library (task 6.3): search box filters by title, content and
 * tags; every card exposes copy + usage counter (REQ-SL-001/002).
 */
export function SnippetLibrary({ snippets }: SnippetLibraryProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return snippets
    }
    return snippets.filter((snippet) => {
      const haystack = [snippet.title, snippet.description ?? "", snippet.content, ...snippet.tags]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, snippets])

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search snippets by title, tag or content…"
          className="ps-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No snippets found</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>
              {query ? "Nothing matches that search." : "Add your first snippet with the form."}
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((snippet) => (
            <li key={snippet.id}>
              <SnippetCard snippet={snippet} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}