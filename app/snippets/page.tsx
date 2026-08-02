import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { SnippetForm } from "@/components/feature/snippet-form"
import { SnippetLibrary } from "@/components/feature/snippet-library"
import { AppleCard, AppleCardTitle } from "@/components/feature/card"
import { getSnippets, getUsedSnippets } from "@/lib/services/snippets"

export const metadata: Metadata = {
  title: "Snippets — Team Tracker",
}

export default async function SnippetsPage() {
  const snippets = await getSnippets()
  const used = await getUsedSnippets()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Snippets"
        description="Reusable text for standups, retros and check-ins — copy, use, repeat."
      />

      <section aria-labelledby="snippets-new-heading" className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <AppleCard className="lg:sticky lg:top-24">
          <AppleCardTitle id="snippets-new-heading">Add snippet</AppleCardTitle>
          <SnippetForm />
        </AppleCard>

        <div className="space-y-6">
          {used.length > 0 ? (
            <AppleCard>
              <AppleCardTitle>Recently used</AppleCardTitle>
              <div className="flex flex-wrap gap-2">
                {used.map((snippet) => (
                  <span key={snippet.id} className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                    {snippet.title} · {snippet.usageCount}×
                  </span>
                ))}
              </div>
            </AppleCard>
          ) : null}

          <AppleCard>
            <AppleCardTitle>All snippets</AppleCardTitle>
            <SnippetLibrary snippets={snippets} />
          </AppleCard>
        </div>
      </section>
    </div>
  )
}