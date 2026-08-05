"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type TiptapEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Stored under a hidden input so the surrounding form submits it. */
  name?: string
  id?: string
}

/**
 * Rich-text editor (Tiptap StarterKit) for tracking comments. Uses
 * `immediatelyRender: false` to avoid SSR hydration mismatches in Next.js.
 */
export function TiptapEditor({
  value,
  onChange,
  placeholder = "Escribí tu comentario…",
  name,
  id,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-28 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground",
        "aria-label": placeholder,
        placeholder,
      },
    },
  })

  if (!editor) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm text-muted-foreground">
        Cargando editor…
      </div>
    )
  }

  const tools = [
    {
      label: "Negrita",
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      label: "Cursiva",
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
    },
    {
      label: "Subtítulo",
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: Heading2Icon,
    },
    {
      label: "Lista",
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: ListIcon,
    },
    {
      label: "Lista numerada",
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      icon: ListOrderedIcon,
    },
    {
      label: "Código",
      active: editor.isActive("code"),
      onClick: () => editor.chain().focus().toggleCode().run(),
      icon: CodeIcon,
    },
  ]

  return (
    <div
      className={cn(
        "group rounded-xl border border-foreground/10 bg-background transition-colors focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-foreground/5 px-2 py-1.5">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            size="icon"
            variant="ghost"
            className={cn("size-8", tool.active && "bg-foreground/10 text-foreground")}
            aria-label={tool.label}
            aria-pressed={tool.active}
            onClick={tool.onClick}
          >
            <tool.icon className="size-4" aria-hidden />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} id={id} />
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  )
}
