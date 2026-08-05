import { Badge } from "@/components/ui/badge"
import type { MemberStatus } from "@/lib/domain"

const MEMBER_STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: "Activo",
    className: "bg-foreground/5 text-foreground",
  },
  recess: {
    label: "En receso",
    className: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  },
}

/** Member status pill (active / on recess). */
export function StatusBadge({ status }: { status: MemberStatus }) {
  const meta = MEMBER_STATUS_META[status]
  return (
    <Badge variant="outline" className={meta.className}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {meta.label}
    </Badge>
  )
}
