"use client"

import { useRef } from "react"
import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function StarRow({ filled, size = "default" }: { filled: boolean; size: "sm" | "default" }) {
  return (
    <StarIcon
      className={cn(
        "shrink-0",
        size === "sm" ? "size-4" : "size-5",
        filled
          ? "fill-amber-400 text-amber-400"
          : "fill-transparent text-foreground/20",
      )}
      aria-hidden="true"
    />
  )
}

type StarRatingProps = {
  value: number
  showValue?: boolean
  size?: "sm" | "default"
}

/** Read-only star display with a complete accessible name. */
export function StarRating({
  value,
  showValue = false,
  size = "default",
}: StarRatingProps) {
  const safeValue = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0
  const filled = Math.round(safeValue)

  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={`Calificación: ${safeValue.toFixed(1)} de 5 estrellas`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarRow key={star} filled={star <= filled} size={size} />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium tabular-nums text-muted-foreground" aria-hidden="true">
          {safeValue.toFixed(1)}
        </span>
      ) : null}
    </span>
  )
}

type StarRatingInputProps = {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "default"
  ariaLabelledBy?: string
}

/** Interactive 1–5 star input with radio semantics and arrow-key navigation. */
export function StarRatingInput({
  value,
  onChange,
  size = "default",
  ariaLabelledBy,
}: StarRatingInputProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  function moveSelection(star: number, direction: "next" | "previous" | "first" | "last") {
    const next =
      direction === "first"
        ? 1
        : direction === "last"
          ? 5
          : direction === "next"
            ? star === 5
              ? 1
              : star + 1
            : star === 1
              ? 5
              : star - 1
    onChange(next)
    requestAnimationFrame(() => buttonRefs.current[next - 1]?.focus())
  }

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="radiogroup"
      aria-label={ariaLabelledBy ? undefined : "Calificación"}
      aria-labelledby={ariaLabelledBy}
      aria-orientation="horizontal"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star === value
        const filled = star <= value
        const tabIndex = value > 0 ? (selected ? 0 : -1) : star === 1 ? 0 : -1

        return (
          <button
            key={star}
            ref={(element) => {
              buttonRefs.current[star - 1] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
            tabIndex={tabIndex}
            onClick={() => onChange(star)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault()
                moveSelection(star, "next")
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault()
                moveSelection(star, "previous")
              } else if (event.key === "Home") {
                event.preventDefault()
                moveSelection(star, "first")
              } else if (event.key === "End") {
                event.preventDefault()
                moveSelection(star, "last")
              }
            }}
            className={cn(
              "cursor-pointer rounded-md p-0.5 transition-transform focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-90",
              !filled && "hover:opacity-70",
            )}
          >
            <StarIcon
              className={cn(
                size === "sm" ? "size-4" : "size-5",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30",
              )}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
