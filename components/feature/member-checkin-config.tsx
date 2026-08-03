"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardDescription, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCheckInConfigAction } from "@/lib/actions/checkins"
import type { Member } from "@/lib/domain"

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Member-level cadence control; next due date remains derived by SQLite. */
export function MemberCheckinConfig({ member }: { member: Member }) {
  const router = useRouter()
  const [frequency, setFrequency] = useState(String(member.checkinFreqDays))
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text: string }>({
    kind: "idle",
    text: "",
  })
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    const nextFrequency = Number(formData.get("frequency"))
    setMessage({ kind: "idle", text: "Guardando…" })
    startTransition(async () => {
      const result = await updateCheckInConfigAction(member.id, nextFrequency)
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error })
        return
      }
      setMessage({ kind: "success", text: "Frecuencia de check-in guardada." })
      toast.success("Frecuencia de check-in guardada")
      router.refresh()
    })
  }

  const hasError = message.kind === "error"

  return (
    <AppleCard>
      <AppleCardHeader>
        <div>
          <AppleCardTitle>Frecuencia de check-in</AppleCardTitle>
          <AppleCardDescription>
            Configurá cada cuánto debería tener un seguimiento este miembro.
          </AppleCardDescription>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Próximo: {formatDate(member.nextCheckinAt)}
        </span>
      </AppleCardHeader>

      <form action={submit} className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-44 gap-1.5">
          <Label htmlFor={`checkin-frequency-${member.id}`}>Frecuencia en días</Label>
          <Input
            id={`checkin-frequency-${member.id}`}
            name="frequency"
            type="number"
            min={1}
            step={1}
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            aria-invalid={hasError}
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !frequency}>
          {isPending ? <Loader2Icon className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          {isPending ? "Guardando…" : "Guardar frecuencia"}
        </Button>
      </form>
      <p
        className={hasError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        aria-live="polite"
        role={hasError ? "alert" : "status"}
      >
        {message.text || `Cada ${member.checkinFreqDays} días`}
      </p>
    </AppleCard>
  )
}
