import type { Feedback, FeedbackCategory } from "@/lib/domain"
import { StarRating } from "@/components/feature/star-rating"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MessageSquareTextIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_META: Record<FeedbackCategory, { label: string; className: string }> = {
  praise: {
    label: "Reconocimiento",
    className: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300",
  },
  coaching: {
    label: "Coaching",
    className: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  },
  concern: {
    label: "Preocupación",
    className: "bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
}

type FeedbackListProps = {
  memberName: string
  entries: Feedback[]
}

function formatDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Feedback entries for a member — stars, content, category and date
 * (REQ-FR-001), newest first.
 */
export function FeedbackList({ memberName, entries }: FeedbackListProps) {
  if (entries.length === 0) {
    return (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareTextIcon />
          </EmptyMedia>
          <EmptyTitle>Sin valoración para {memberName.split(" ")[0]}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Enviá la primera entrada con el formulario en esta página.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const category = CATEGORY_META[entry.category]
        return (
          <li key={entry.id} className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StarRating value={entry.rating} size="sm" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("border-transparent", category.className)}>
                  {category.label}
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDate(entry.date)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-foreground">{entry.content}</p>
          </li>
        )
      })}
    </ul>
  )
}