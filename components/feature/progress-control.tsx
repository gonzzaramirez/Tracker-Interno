"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { recordProgressAction } from "@/lib/actions/tasks"

type ProgressControlProps = {
  taskId: string
  initialValue: number
}

/**
 * 0-100 progress slider that persists a ProgressRecord (date, value, note)
 * through a Server Action (REQ-TT-003). Empty history renders 0.
 */
export function ProgressControl({ taskId, initialValue }: ProgressControlProps) {
  const [draft, setDraft] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  const value = draft ?? initialValue

  function save() {
    startTransition(async () => {
      const result = await recordProgressAction(taskId, value, note.trim() || undefined)
      if (result.ok) {
        toast.success("Progress saved")
        setDraft(null)
        setNote("")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <Slider
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={(next) => setDraft(Array.isArray(next) ? next[0] : next)}
          aria-label={`Progress for ${taskId}`}
        />
        <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
          {value}%
        </span>
      </div>
      <Progress value={value} aria-label="Progress" />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Note for this record (optional)"
          className="h-7 max-w-56 text-xs"
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isPending || (draft === null && note.trim() === "")}
          onClick={save}
        >
          {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <SaveIcon className="size-3.5" />}
          Save
        </Button>
      </div>
    </div>
  )
}