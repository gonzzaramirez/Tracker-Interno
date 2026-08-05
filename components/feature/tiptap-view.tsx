import type { CSSProperties } from "react"

type TiptapViewProps = {
  /** Sanitized Tiptap HTML produced by the editor. */
  html: string
  className?: string
  style?: CSSProperties
}

/**
 * Renders a stored rich-text comment. HTML is normalized at write time
 * (`normalizeContentHtml`) so scripts/attributes never survive; rendering it
 * here is intentional.
 */
export function TiptapView({ html, className, style }: TiptapViewProps) {
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
