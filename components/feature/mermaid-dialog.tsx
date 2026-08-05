"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ExcalidrawAPI } from "@/components/feature/excalidraw-types"

const MERMAID_PLACEHOLDER = `flowchart TD
  A[Inicio] --> B{¿Listo?}
  B -->|Sí| C[Entregar]
  B -->|No| D[Revisar]
  D --> B`

type MermaidDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  getAPI: () => ExcalidrawAPI | null
  onConverted: () => void
}

/**
 * Converts a Mermaid flowchart into Excalidraw elements and appends them to
 * the current scene. Parser and converter are loaded on demand (browser-only).
 */
export function MermaidDialog({ open, onOpenChange, getAPI, onConverted }: MermaidDialogProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [converting, setConverting] = useState(false)

  async function convert() {
    if (!code.trim() || converting) return
    setConverting(true)
    setError("")
    try {
      const [{ parseMermaidToExcalidraw }, { convertToExcalidrawElements }] = await Promise.all([
        import("@excalidraw/mermaid-to-excalidraw"),
        import("@excalidraw/excalidraw"),
      ])
      const { elements, files } = await parseMermaidToExcalidraw(code)
      const excalidrawElements = convertToExcalidrawElements(elements)

      const api = getAPI()
      if (!api) {
        setError("El editor todavía no está listo. Probá de nuevo en un momento.")
        return
      }
      api.updateScene({
        elements: [...api.getSceneElements(), ...(excalidrawElements as unknown as unknown[])],
      })
      if (files && Object.keys(files).length > 0) {
        api.addFiles(files as unknown as Record<string, unknown>)
      }
      setCode("")
      onConverted()
    } catch {
      setError("No se pudo convertir el diagrama. Revisá la sintaxis de Mermaid (solo flowcharts).")
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mermaid a Excalidraw</DialogTitle>
          <DialogDescription>
            Pegá un diagrama Mermaid (flowchart) y se agrega a la pizarra como elementos editables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="mermaid-code">Código Mermaid</Label>
          <Textarea
            id="mermaid-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={MERMAID_PLACEHOLDER}
            rows={10}
            className="font-mono text-xs"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={convert} disabled={converting || !code.trim()}>
            {converting ? (
              <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            Convertir y agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
