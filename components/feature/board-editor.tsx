"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeftIcon, Loader2Icon, WorkflowIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MermaidDialog } from "@/components/feature/mermaid-dialog"
import type { ExcalidrawAPI } from "@/components/feature/excalidraw-types"
import { saveBoardSceneAction } from "@/lib/actions/boards"
import type { BoardScene } from "@/lib/domain"

// Excalidraw is a UMD/browser-only bundle: never render it on the server.
const ExcalidrawComponent = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  { ssr: false, loading: () => <EditorFallback /> },
)

type ExcalidrawProps = React.ComponentProps<typeof ExcalidrawComponent>

function EditorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
    </div>
  )
}

type SaveStatus = "saved" | "saving" | "unsaved"

type BoardEditorProps = {
  boardId: string
  boardName: string
  initialScene: BoardScene
}

/**
 * Cheap scene signature (element ids + versions + background + file ids).
 * Excalidraw's onChange fires on pan/zoom/selection — this lets us skip
 * saves when nothing real changed. File ids (sorted, not just a count) are
 * included so adding, removing, or replacing an image always counts as a
 * change (count alone misses delete + paste pairs that keep the same size).
 */
function sceneSignature(scene: BoardScene): string {
  const elements = (scene.elements ?? []) as Array<{ id?: unknown; version?: unknown }>
  const parts = elements.map((e) => `${String(e.id)}:${String(e.version)}`).join("|")
  const viewBg = (scene.appState as { viewBackgroundColor?: unknown } | undefined)?.viewBackgroundColor
  const fileIds =
    scene.files && typeof scene.files === "object" ? Object.keys(scene.files).sort().join(",") : ""
  return `${parts}|bg:${String(viewBg)}|files:${fileIds}`
}

/**
 * Excalidraw editor with debounced autosave to SQLite. Restores the scene on
 * mount (client-side only) and persists on every real change + on unmount.
 */
export function BoardEditor({ boardId, boardName, initialScene }: BoardEditorProps) {
  const [sceneReady, setSceneReady] = useState<NonNullable<ExcalidrawProps["initialData"]> | null>(null)
  const [mermaidOpen, setMermaidOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestScene = useRef<BoardScene | null>(null)
  const lastSavedSignature = useRef<string | null>(null)
  const excalidrawAPI = useRef<ExcalidrawAPI | null>(null)

  // Restore the persisted scene with excalidraw's restore() util (validates
  // and repairs elements so a corrupt payload can never crash the editor).
  // Files MUST round-trip too: image elements only reference a fileId, the
  // actual bytes (base64 dataURLs) live in `files`. Without them pasted
  // images vanish after reload — and the next autosave would overwrite the
  // stored dataURLs with an empty map, losing them forever.
  //
  // The theme is forced dark, but Excalidraw's dark mode does NOT paint a
  // dark canvas: it paints appState.viewBackgroundColor (default white) and
  // applies an invert(93%) CSS filter on the canvas, turning white into the
  // dark canvas color. So the stored raw color round-trips as-is. The old
  // "#1e1e1e" forced value was a hack that renders as LIGHT gray under that
  // filter — migrate it to undefined (falls back to white → dark canvas).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { restore } = await import("@excalidraw/excalidraw")
      const storedBg = (initialScene.appState as { viewBackgroundColor?: unknown } | undefined)
        ?.viewBackgroundColor
      const viewBackgroundColor = storedBg === "#1e1e1e" ? undefined : storedBg
      const restored = await restore(
        {
          elements: initialScene.elements,
          appState: { ...initialScene.appState, viewBackgroundColor },
          files: initialScene.files,
        } as unknown as Parameters<typeof restore>[0],
        null,
        null,
      )
      if (!cancelled) {
        lastSavedSignature.current = sceneSignature(initialScene)
        setSceneReady(restored as unknown as NonNullable<ExcalidrawProps["initialData"]>)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialScene])

  const persist = useCallback(
    async (scene: BoardScene) => {
      setSaveStatus("saving")
      const result = await saveBoardSceneAction(boardId, scene)
      if (result.ok) {
        lastSavedSignature.current = sceneSignature(scene)
        setSaveStatus("saved")
      } else {
        setSaveStatus("unsaved")
      }
    },
    [boardId],
  )

  // Debounced autosave: only when the scene actually changed, 2s after the
  // last change (pan/zoom/selection produce identical signatures → no save).
  const handleChange = useCallback(
    (elements: readonly unknown[], appState: unknown, files: unknown) => {
      const scene: BoardScene = {
        elements: [...elements],
        appState: {
          viewBackgroundColor: (appState as { viewBackgroundColor?: unknown }).viewBackgroundColor,
        },
        files: files === undefined ? undefined : (files as Record<string, unknown>),
      }
      if (sceneSignature(scene) === lastSavedSignature.current) return

      latestScene.current = scene
      setSaveStatus("unsaved")
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => void persist(scene), 2000)
    },
    [persist],
  )

  // Flush pending changes on unmount.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (latestScene.current && sceneSignature(latestScene.current) !== lastSavedSignature.current) {
        void persist(latestScene.current)
      }
    }
  }, [persist])

  const saveLabel =
    saveStatus === "saved" ? "Guardado" : saveStatus === "saving" ? "Guardando…" : "Sin guardar"

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label="Volver a pizarras"
            render={<Link href="/boards" />}
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
          </Button>
          <h1 className="truncate text-base font-semibold text-foreground">{boardName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs tabular-nums ${
              saveStatus === "saved" ? "text-muted-foreground" : "text-amber-600"
            }`}
            role="status"
          >
            {saveLabel}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setMermaidOpen(true)}>
            <WorkflowIcon className="size-4" aria-hidden />
            Mermaid
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        {sceneReady ? (
          <ExcalidrawComponent
            langCode="es"
            theme="dark"
            initialData={sceneReady}
            onChange={handleChange as unknown as ExcalidrawProps["onChange"]}
            excalidrawAPI={(api) => {
              excalidrawAPI.current = api as unknown as ExcalidrawAPI
            }}
            UIOptions={{ canvasActions: { toggleTheme: false } }}
          />
        ) : (
          <EditorFallback />
        )}
      </div>

      <MermaidDialog
        open={mermaidOpen}
        onOpenChange={setMermaidOpen}
        getAPI={() => excalidrawAPI.current}
        onConverted={() => {
          setMermaidOpen(false)
          setSaveStatus("unsaved")
        }}
      />
    </div>
  )
}
