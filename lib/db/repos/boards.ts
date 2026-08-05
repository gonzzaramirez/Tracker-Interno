/**
 * Boards repository — Excalidraw whiteboards per tenant.
 * The list path never selects scene_json to keep payloads small even with
 * hundreds of boards.
 */
import { randomUUID } from "node:crypto"

import { mutate, query, queryOne } from "../query"
import type { BoardRow } from "../schema"
import type { Board, BoardScene } from "@/lib/domain"

export type BoardWithScene = Board & { scene: BoardScene }

function toBoard(row: BoardRow): Board {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listBoards(userId: string): Promise<Board[]> {
  const rows = await query<BoardRow>(
    "SELECT id, user_id, name, created_at, updated_at FROM boards WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
    [userId],
  )
  return rows.map(toBoard)
}

export async function getBoard(userId: string, id: string): Promise<Board | undefined> {
  const row = await queryOne<BoardRow>("SELECT * FROM boards WHERE user_id = ? AND id = ?", [userId, id])
  return row ? toBoard(row) : undefined
}

/** Board including its full scene — used only by the editor page. */
export async function getBoardWithScene(userId: string, id: string): Promise<BoardWithScene | undefined> {
  const row = await queryOne<BoardRow>("SELECT * FROM boards WHERE user_id = ? AND id = ?", [userId, id])
  if (!row) return undefined
  return { ...toBoard(row), scene: parseScene(row.scene_json) }
}

function parseScene(raw: string): BoardScene {
  if (!raw) return { elements: [] }
  try {
    const parsed = JSON.parse(raw) as BoardScene
    return { elements: Array.isArray(parsed.elements) ? parsed.elements : [], appState: parsed.appState, files: parsed.files }
  } catch {
    return { elements: [] }
  }
}

export async function insertBoard(userId: string, name: string): Promise<Board> {
  const id = randomUUID()
  const now = new Date().toISOString()
  await mutate("INSERT INTO boards (id, user_id, name, scene_json, created_at, updated_at) VALUES (?, ?, ?, '{}', ?, ?)", [id, userId, name, now, now])
  const board = await getBoard(userId, id)
  if (!board) throw new Error(`Board ${id} could not be read after insert.`)
  return board
}

export async function renameBoard(userId: string, id: string, name: string): Promise<Board | undefined> {
  await mutate("UPDATE boards SET name = ?, updated_at = ? WHERE user_id = ? AND id = ?", [name, new Date().toISOString(), userId, id])
  return getBoard(userId, id)
}

export async function updateBoardScene(userId: string, id: string, scene: BoardScene): Promise<boolean> {
  const changes = await mutate(
    "UPDATE boards SET scene_json = ?, updated_at = ? WHERE user_id = ? AND id = ?",
    [JSON.stringify(scene), new Date().toISOString(), userId, id],
  )
  return changes > 0
}

export async function deleteBoard(userId: string, id: string): Promise<boolean> {
  const changes = await mutate("DELETE FROM boards WHERE user_id = ? AND id = ?", [userId, id])
  return changes > 0
}
