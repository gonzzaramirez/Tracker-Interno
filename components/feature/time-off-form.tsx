"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { requestTimeOffAction } from "@/lib/actions/timeoff"
import type { Member, TimeOffType } from "@/lib/domain"

const TYPES: Array<{ value: TimeOffType; label: string }> = [
  { value: "vacation", label: "Vacaciones" },
  { value: "license", label: "Licencia" },
  { value: "sickness", label: "Enfermedad" },
  { value: "holiday", label: "Feriado" },
]

type TimeOffFormProps = {
  members: Member[]
  /** When provided, the form edits this entry. */
  entry?: {
    id: string
    memberId: string
    startDate: string
    endDate: string
    type: TimeOffType
    note?: string
  }
  onClose?: () => void
}

/**
 * Time-off create/edit form — the owner loads, edits and deletes absences
 * directly (no approval flow).
 */
export function TimeOffForm({ members, entry, onClose }: TimeOffFormProps) {
  const [memberId, setMemberId] = useState(entry?.memberId ?? members[0]?.id ?? "")
  const [type, setType] = useState<TimeOffType>(entry?.type ?? "vacation")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    const input = {
      memberId,
      type,
      startDate: String(formData.get("start") ?? ""),
      endDate: String(formData.get("end") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      // The owner loads absences directly — always approved.
      status: "approved" as const,
    }

    startTransition(async () => {
      const result = await requestTimeOffAction(input)
      if (result.ok) {
        toast.success(entry ? "Ausencia actualizada" : "Ausencia cargada")
        if (!entry) {
          formRef.current?.reset()
        }
        onClose?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeoff-member">Miembro</Label>
        <Select
          value={memberId}
          onValueChange={(value) => setMemberId(value ?? "")}
          items={members.map((member) => ({ value: member.id, label: member.name }))}
        >
          <SelectTrigger id="timeoff-member" aria-label="Miembro" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timeoff-start" className="text-sm leading-none font-medium select-none">
            Inicio
          </label>
          <Input
            id="timeoff-start"
            name="start"
            type="date"
            required
            defaultValue={entry?.startDate}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timeoff-end" className="text-sm leading-none font-medium select-none">
            Fin
          </label>
          <Input id="timeoff-end" name="end" type="date" required defaultValue={entry?.endDate} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeoff-type">Tipo</Label>
        <Select value={type} onValueChange={(value) => setType((value as TimeOffType) ?? "vacation")} items={TYPES}>
          <SelectTrigger id="timeoff-type" aria-label="Tipo de ausencia" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeoff-note">Nota</Label>
        <Input id="timeoff-note" name="note" placeholder="Nota (opcional)…" defaultValue={entry?.note} />
      </div>

      <div>
        <Button type="submit" disabled={isPending || !memberId}>
          {isPending ? (
            <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          {entry ? "Guardar cambios" : "Cargar ausencia"}
        </Button>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose} className="ml-2">
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
