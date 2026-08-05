import type { Metadata } from "next"
import { LayoutGridIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { BoardCard } from "@/components/feature/board-card"
import { BoardCreateForm } from "@/components/feature/board-create-form"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from "@/lib/auth-guard"
import { getBoards } from "@/lib/services/boards"

export const metadata: Metadata = {
  title: "Pizarras",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function BoardsPage() {
  const userId = await requireAuth()
  const boards = await getBoards(userId)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Pizarras"
        description="Pizarras colaborativas para diagramar flujos, planificar sprints y volcar ideas — cada una se guarda sola."
      />

      <div className="mt-6">
        <BoardCreateForm />
      </div>

      {boards.length === 0 ? (
        <div className="mt-6">
          <Empty className="min-h-48">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGridIcon />
              </EmptyMedia>
              <EmptyTitle>Sin pizarras aún</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Creá la primera pizarra para empezar a diagramar.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </ul>
      )}
    </div>
  )
}
