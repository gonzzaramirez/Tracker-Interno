"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBoardAction } from "@/lib/actions/boards"

/** Inline form to create a new board. */
export function BoardCreateForm() {
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createBoardAction(name)
      if (result.ok) {
        toast.success("Pizarra creada")
        router.push(`/boards/${result.data.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form
      action={submit}
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/40 p-3"
      aria-label="Crear pizarra"
    >
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la nueva pizarra…"
        aria-label="Nombre de la pizarra"
        className="max-w-sm flex-1"
        maxLength={80}
      />
      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? (
          <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <PlusIcon className="size-4" aria-hidden />
        )}
        Crear pizarra
      </Button>
    </form>
  )
}
