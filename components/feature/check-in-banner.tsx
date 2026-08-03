"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CheckCircle2Icon, Clock3Icon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { SemaphorePill } from "@/components/feature/semaphore-pill"
import { Button } from "@/components/ui/button"
import { completeCheckInAction } from "@/lib/actions/checkins"
import type { CheckInReminder } from "@/lib/domain"
import { cn } from "@/lib/utils"

function formatDueDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** In-app reminder for members whose scheduled check-in is due. */
export function CheckInBanner({ reminders }: { reminders: CheckInReminder[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (reminders.length === 0) {
    return null
  }

  function markDone(memberId: string, memberName: string) {
    startTransition(async () => {
      const result = await completeCheckInAction({
        memberId,
        semaphore: "green",
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Check-in completed for ${memberName}`)
      router.refresh()
    })
  }

  return (
    <AppleCard className="border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/10">
      <AppleCardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <Clock3Icon className="size-4" aria-hidden />
          </span>
          <div>
            <AppleCardTitle>Check-ins due</AppleCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep the follow-up rhythm moving for each member.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
          {reminders.length} pending
        </span>
      </AppleCardHeader>

      <ul className="divide-y divide-amber-900/10 dark:divide-amber-100/10">
        {reminders.map(({ member, dueDate, state, lastSemaphore }) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              aria-hidden
            >
              {member.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {state === "overdue" ? "Overdue" : "Due today"} · {formatDueDate(dueDate)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                state === "overdue"
                  ? "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                  : "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
              )}
            >
              {state === "overdue" ? "Overdue" : "Due"}
            </span>
            <SemaphorePill semaphore={lastSemaphore} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              aria-label={`Mark check-in done for ${member.name}`}
              onClick={() => markDone(member.id, member.name)}
            >
              {isPending ? <Loader2Icon className="animate-spin" aria-hidden /> : <CheckCircle2Icon aria-hidden />}
              Mark done
            </Button>
          </li>
        ))}
      </ul>
    </AppleCard>
  )
}
