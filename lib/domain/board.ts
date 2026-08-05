/** Excalidraw whiteboard (per tenant). */
export type Board = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

/** Serialized Excalidraw scene persisted in SQLite (scene_json column). */
export type BoardScene = {
  elements: unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}
