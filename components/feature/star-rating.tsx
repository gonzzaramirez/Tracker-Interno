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
          : "fill-transparent text-foreground/20"
      )}
      aria-hidden
    />
  )
}

type StarRatingProps = {
  value: number
  showValue?: boolean
  size?: "sm" | "default"
}

/**
 * Read-only star display 0-5 (REQ-FR-001). Fractional values round to the
 * nearest star and, when `showValue`, the numeric average is displayed.
 */
export function StarRating({
  value,
  showValue = false,
  size = "default",
}: StarRatingProps) {
  const filled = Math.round(Math.min(5, Math.max(0, value)))

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarRow key={star} filled={star <= filled} size={size} />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {value.toFixed(1)}
        </span>
      ) : null}
    </span>
  )
}

type StarRatingInputProps = {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "default"
}

/**
 * Interactive 1-5 star input (task 5.3) built with lucide — base-nova ships
 * no rating component.
 */
export function StarRatingInput({ value, onChange, size = "default" }: StarRatingInputProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star <= value
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange(star)}
            className={cn(
              "cursor-pointer rounded-md p-0.5 transition-transform focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-90",
              !selected && "hover:opacity-70"
            )}
          >
            <StarIcon
              className={cn(
                size === "sm" ? "size-4" : "size-5",
                selected
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}