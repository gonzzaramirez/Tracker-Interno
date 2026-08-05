"use client"

import { useState, useTransition } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { markAttendanceAction, unmarkAttendanceAction } from "@/lib/actions/attendance"
import type { Member } from "@/lib/domain"
import { todayISO } from "@/lib/domain/date"

type QuickAttendanceProps = {
  members: Member[]
  presentIds: string[]
}

/**
 * One-tap daily attendance: each member is a chip you toggle present/absent.
 * Marks persist for today; tapping again removes the mark.
 */
export function QuickAttendance({ members, presentIds }: QuickAttendanceProps) {
  const [present, setPresent] = useState<Set<string>>(() => new Set(presentIds))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function toggle(member: Member) {
    const isPresent = present.has(member.id)
    setPendingId(member.id)
    // Optimistic toggle so the UI feels instant; revalidate on server.
    setPresent((current) => {
      const next = new Set(current)
      if (isPresent) {
        next.delete(member.id)
      } else {
        next.add(member.id)
      }
      return next
    })

    startTransition(async () => {
      const result = isPresent
        ? await unmarkAttendanceAction(member.id)
        : await markAttendanceAction(member.id)
      setPendingId(null)
      if (!result.ok) {
        // Roll back on error.
        setPresent((current) => {
          const next = new Set(current)
          if (isPresent) {
            next.add(member.id)
          } else {
            next.delete(member.id)
          }
          return next
        })
        toast.error(result.error)
      }
    })
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Agregá miembros para empezar a marcar asistencia.
      </p>
    )
  }

  const count = present.size

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {members.map((member) => {
          const isPresent = present.has(member.id)
          const isPending = pendingId === member.id
          const initials = member.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => toggle(member)}
              disabled={isPending}
              aria-pressed={isPresent}
              aria-label={`${isPresent ? "Quitar" : "Marcar"} presencia de ${member.name}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium ring-1 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50",
                isPresent
                  ? "bg-green-500/10 text-green-700 ring-green-500/30 dark:text-green-300"
                  : "bg-muted/40 text-muted-foreground ring-foreground/10 hover:bg-muted",
              )}
            >
              <span
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                style={member.displayColor ? { backgroundColor: member.displayColor } : undefined}
                aria-hidden
              >
                {isPending ? (
                  <Loader2Icon className="size-3 motion-safe:animate-spin motion-reduce:animate-none" />
                ) : isPresent ? (
                  <CheckIcon className="size-3" />
                ) : (
                  initials
                )}
              </span>
              <span className="whitespace-nowrap">{member.name}</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {count === 0
          ? "Nadie marcado todavía — tocá para registrar quién está activo."
          : `${count} de ${members.length} activos hoy.`}
      </p>
    </div>
  )
}
