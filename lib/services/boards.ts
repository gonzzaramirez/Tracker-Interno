/** Board use cases per tenant. */
import { cache } from "react"

import type { Board, BoardScene } from "@/lib/domain"
import {
  deleteBoard as deleteBoardRepo,
  getBoard as getBoardRepo,
  getBoardWithScene as getBoardWithSceneRepo,
  insertBoard,
  listBoards,
  renameBoard as renameBoardRepo,
  updateBoardScene as updateBoardSceneRepo,
} from "@/lib/db/repos/boards"

const memoList = cache((userId: string) => listBoards(userId))

/** Max serialized scene size to protect the DB (8 MB). */
const MAX_SCENE_BYTES = 8 * 1024 * 1024

function assertName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("El nombre de la pizarra es obligatorio.")
  if (trimmed.length > 80) throw new Error("El nombre no puede superar los 80 caracteres.")
  return trimmed
}

export async function getBoards(userId: string): Promise<Board[]> {
  return memoList(userId)
}

export async function getBoard(userId: string, id: string): Promise<Board | undefined> {
  return getBoardRepo(userId, id)
}

/** Board with scene — editor page only. */
export async function getBoardWithScene(userId: string, id: string) {
  return getBoardWithSceneRepo(userId, id)
}

export async function createBoard(userId: string, name: string): Promise<Board> {
  return insertBoard(userId, assertName(name))
}

export async function renameBoard(userId: string, id: string, name: string): Promise<Board> {
  const updated = await renameBoardRepo(userId, id, assertName(name))
  if (!updated) throw new Error("Pizarra no encontrada.")
  return updated
}

export async function saveBoardScene(userId: string, id: string, scene: BoardScene): Promise<void> {
  const board = await getBoardRepo(userId, id)
  if (!board) throw new Error("Pizarra no encontrada.")
  if (!Array.isArray(scene.elements)) throw new Error("Escena inválida.")
  const payload = JSON.stringify(scene)
  if (Buffer.byteLength(payload, "utf8") > MAX_SCENE_BYTES) {
    throw new Error("La escena es demasiado grande para guardarse.")
  }
  await updateBoardSceneRepo(userId, id, scene)
}

export async function deleteBoard(userId: string, id: string): Promise<void> {
  if (!(await deleteBoardRepo(userId, id))) throw new Error("Pizarra no encontrada.")
}
