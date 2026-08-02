import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: ReactNode
  eyebrow?: string
  actions?: ReactNode
}

/**
 * Consistent section header used by every capability page.
 */
export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-1">
      {eyebrow ? (
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}