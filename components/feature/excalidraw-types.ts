/**
 * Minimal structural subset of ExcalidrawImperativeAPI.
 * The package does not re-export its types, so we only declare the methods
 * we actually use; the real API satisfies this shape structurally.
 */
export type ExcalidrawAPI = {
  updateScene: (scene: { elements: unknown[] }) => void
  getSceneElements: () => unknown[]
  addFiles: (files: Record<string, unknown>) => void
}
