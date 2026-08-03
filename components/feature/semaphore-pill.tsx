import type { Semaphore } from "@/lib/domain"
import { cn } from "@/lib/utils"

const SEMAPHORE_META: Record<Semaphore, { label: string; className: string }> = {
  green: {
    label: "On track",
    className: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300",
  },
  yellow: {
    label: "Needs attention",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
  red: {
    label: "Blocked",
    className: "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
}

export function SemaphorePill({ semaphore }: { semaphore: Semaphore | null }) {
  if (!semaphore) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-current opacity-60" aria-hidden />
        No signal
      </span>
    )
  }

  const meta = SEMAPHORE_META[semaphore]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}
