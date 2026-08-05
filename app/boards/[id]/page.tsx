import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BoardEditor } from "@/components/feature/board-editor"
import { requireAuth } from "@/lib/auth-guard"
import { getBoardWithScene } from "@/lib/services/boards"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const userId = await requireAuth()
  const board = await getBoardWithScene(userId, id)
  return { title: board ? `Pizarra · ${board.name}` : "Pizarra" }
}

export default async function BoardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await requireAuth()
  const board = await getBoardWithScene(userId, id)
  if (!board) {
    notFound()
  }

  // Fixed full-bleed container: escapes the layout's max-w-5xl so the
  // whiteboard spans the whole viewport below the nav, with no page scroll.
  return (
    <div className="fixed inset-x-0 bottom-0 top-[3.25rem] z-0 px-4 pb-4 sm:px-6 lg:px-8">
      <BoardEditor
        boardId={board.id}
        boardName={board.name}
        initialScene={board.scene}
      />
    </div>
  )
}
