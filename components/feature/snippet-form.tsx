"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createSnippetAction } from "@/lib/actions/snippets"

/**
 * New snippet form (REQ-SL-001). Tags are typed as a comma-separated list,
 * parsed client-side before the Server Action.
 */
export function SnippetForm() {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    startTransition(async () => {
      const result = await createSnippetAction({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        tags,
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
        <Input
          name="title"
          placeholder="Title — e.g. Weekly standup recap"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Textarea
          name="content"
          rows={4}
          required
          placeholder="Block of text worth reusing…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          name="description"
          placeholder="Short description (optional)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          name="tags"
          placeholder="Tags, comma separated (optional)"
        />
      </div>
      <div>
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Add snippet
        </Button>
      </div>
    </form>
  )
}