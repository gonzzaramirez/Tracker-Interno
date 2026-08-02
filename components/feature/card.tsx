import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Apple-style card wrapper (decision D6).
 *
 * Generous rounded corners, a hairline ring and soft inset spacing — the
 * base-nova `card.tsx` stays untouched by design.
 */
function AppleCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="apple-card"
      className={cn(
        "group/apple-card flex flex-col gap-(--card-spacing) rounded-(--radius-card) bg-card p-(--card-spacing) text-card-foreground ring-1 ring-foreground/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] [--card-spacing:--spacing(6)]",
        className
      )}
      {...props}
    />
  )
}

function AppleCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="apple-card-header"
      className={cn(
        "flex flex-wrap items-start justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function AppleCardTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="apple-card-title"
      className={cn(
        "text-base font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AppleCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="apple-card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { AppleCard, AppleCardHeader, AppleCardTitle, AppleCardDescription }