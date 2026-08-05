"use client"

import {
  Rating as ReactRating,
  Heart,
  RoundedStar,
  Star,
  type ItemStyles,
} from "@smastrom/react-rating"

import { cn } from "@/lib/utils"

/** Available rating visuals — pick one and everything (input + display) follows. */
export const RATING_SHAPES = ["star", "rounded", "heart"] as const
export type RatingShape = (typeof RATING_SHAPES)[number]

const SHAPE_STYLES: Record<RatingShape, ItemStyles> = {
  star: {
    itemShapes: Star,
    itemStrokeWidth: 1.6,
    activeFillColor: "var(--rating-active)",
    activeStrokeColor: "var(--rating-active-stroke)",
    inactiveFillColor: "var(--rating-inactive)",
    inactiveStrokeColor: "var(--rating-inactive-stroke)",
  },
  rounded: {
    itemShapes: RoundedStar,
    itemStrokeWidth: 1.4,
    activeFillColor: "var(--rating-active)",
    activeStrokeColor: "var(--rating-active-stroke)",
    inactiveFillColor: "var(--rating-inactive)",
    inactiveStrokeColor: "var(--rating-inactive-stroke)",
  },
  heart: {
    itemShapes: Heart,
    itemStrokeWidth: 1.6,
    activeFillColor: "#fb7185",
    activeStrokeColor: "#f43f5e",
    inactiveFillColor: "var(--rating-inactive)",
    inactiveStrokeColor: "var(--rating-inactive-stroke)",
  },
}

const ITEM_LABELS = [
  "Calificar con 1 de 5",
  "Calificar con 2 de 5",
  "Calificar con 3 de 5",
  "Calificar con 4 de 5",
  "Calificar con 5 de 5",
]

const SIZE_WIDTH: Record<"sm" | "default", number> = { sm: 92, default: 124 }

type StarRatingProps = {
  value: number
  showValue?: boolean
  size?: "sm" | "default"
  shape?: RatingShape
}

/** Read-only rating display with a complete accessible name. */
export function StarRating({
  value,
  showValue = false,
  size = "default",
  shape = "star",
}: StarRatingProps) {
  const safeValue = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0

  return (
    <span className="inline-flex items-center gap-1.5">
      <ReactRating
        readOnly
        value={safeValue}
        itemStyles={SHAPE_STYLES[shape]}
        style={{ maxWidth: SIZE_WIDTH[size] }}
        invisibleLabel={`Calificación: ${safeValue.toFixed(1)} de 5`}
      />
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
  shape?: RatingShape
  ariaLabelledBy?: string
}

/** Interactive 1–5 rating input backed by @smastrom/react-rating. */
export function StarRatingInput({
  value,
  onChange,
  size = "default",
  shape = "star",
  ariaLabelledBy,
}: StarRatingInputProps) {
  return (
    <ReactRating
      value={value}
      onChange={onChange}
      itemStyles={SHAPE_STYLES[shape]}
      style={{ maxWidth: SIZE_WIDTH[size] }}
      transition="zoom"
      invisibleLabel={ariaLabelledBy ? undefined : "Calificación"}
      visibleLabelId={ariaLabelledBy}
      invisibleItemLabels={ITEM_LABELS}
      resetLabel="Quitar calificación"
      className={cn("cursor-pointer")}
    />
  )
}
