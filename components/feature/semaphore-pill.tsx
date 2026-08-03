import type { Semaphore } from "@/lib/domain"
import { cn } from "@/lib/utils"

const SEMAPHORE_META: Record<Semaphore, { label: string; className: string }> = {
  green: {
    label: "En camino",
    className: "bg-ok-green/10 text-ok-green",
  },
  yellow: {
    label: "Necesita atención",
    className: "bg-ok-amber/10 text-ok-amber",
  },
  red: {
    label: "Bloqueado",
    className: "bg-ok-red/10 text-ok-red",
  },
}

export function SemaphorePill({ semaphore }: { semaphore: Semaphore | null }) {
  if (!semaphore) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-current opacity-60" aria-hidden />
        Sin señal
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
