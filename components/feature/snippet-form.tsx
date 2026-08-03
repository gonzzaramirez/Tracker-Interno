"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSnippetAction } from "@/lib/actions/snippets"

/**
 * New snippet form (REQ-SL-003): title, description and raw content only.
 */
export function SnippetForm() {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createSnippetAction({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
      })
      if (result.ok) {
        toast.success("Snippet saved")
        formRef.current?.reset()
        setTitle("")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="snippet-title">Title</Label>
        <Input
          id="snippet-title"
          name="title"
          placeholder="e.g. Weekly standup recap…"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="snippet-content">Content</Label>
        <Textarea
          id="snippet-content"
          name="content"
          rows={4}
          required
          placeholder="Block of text worth reusing…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="snippet-description">Description</Label>
        <Input
          id="snippet-description"
          name="description"
          placeholder="Short description (optional)…"
        />
      </div>
      <div>
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          Add snippet
        </Button>
      </div>
    </form>
  )
}
