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

type TimeOffFormProps = {
  members: Member[]
}

const TYPES: Array<{ value: TimeOffType; label: string }> = [
  { value: "vacation", label: "Vacaciones" },
  { value: "license", label: "Licencia" },
  { value: "sickness", label: "Enfermedad" },
  { value: "holiday", label: "Feriado" },
]

/**
 * Time-off request form (REQ-TO-003): member, inclusive date range and type
 * go through a Server Action.
 */
export function TimeOffForm({ members }: TimeOffFormProps) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "")
  const [type, setType] = useState<TimeOffType>("vacation")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await requestTimeOffAction({
        memberId,
        type,
        startDate: String(formData.get("start") ?? ""),
        endDate: String(formData.get("end") ?? ""),
        note: String(formData.get("note") ?? "") || undefined,
      })
      if (result.ok) {
        toast.success("Ausencia solicitada")
        formRef.current?.reset()
        setType("vacation")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeoff-member">Miembro</Label>
        <Select value={memberId} onValueChange={(value) => setMemberId(value ?? "")}>
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
          <Input id="timeoff-start" name="start" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timeoff-end" className="text-sm leading-none font-medium select-none">
            Fin
          </label>
          <Input id="timeoff-end" name="end" type="date" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeoff-type">Tipo</Label>
        <Select
          value={type}
          onValueChange={(value) => setType((value as TimeOffType) ?? "vacation")}
        >
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
        <Input id="timeoff-note" name="note" placeholder="Nota (opcional)…" />
      </div>

      <div>
        <Button type="submit" disabled={isPending || !memberId}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          Solicitar ausencia
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Las solicitudes nuevas quedan pendientes hasta ser aprobadas.
        </p>
      </div>
    </form>
  )
}
