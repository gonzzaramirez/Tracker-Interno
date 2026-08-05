"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarClockIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteBoardAction, renameBoardAction } from "@/lib/actions/boards"
import type { Board } from "@/lib/domain"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type BoardCardProps = {
  board: Board
}

/**
 * Board card: name, creation and last-modification dates, open/rename/delete.
 */
export function BoardCard({ board }: BoardCardProps) {
  const router = useRouter()
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(board.name)
  const [isPending, startTransition] = useTransition()

  function confirmRename() {
    if (!name.trim() || name.trim() === board.name) {
      setRenaming(false)
      return
    }
    startTransition(async () => {
      const result = await renameBoardAction(board.id, name)
      if (result.ok) {
        toast.success("Pizarra renombrada")
        setRenaming(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteBoardAction(board.id)
      if (result.ok) {
        toast.success("Pizarra eliminada")
        router.refresh()
      } else {
        toast.error(result.error)
      }
      setDeleting(false)
    })
  }

  return (
    <li className="group relative flex flex-col gap-3 rounded-2xl bg-muted/40 p-4 transition-colors hover:bg-muted/60">
      <Link
        href={`/boards/${board.id}`}
        className="flex min-h-24 flex-1 flex-col justify-between gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Abrir ${board.name}`}
      >
        <p className="text-sm font-semibold text-foreground">{board.name}</p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClockIcon className="size-3.5" aria-hidden />
            Creada el {formatDate(board.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            Modificada el {formatDate(board.updatedAt)}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" aria-label="Renombrar pizarra" onClick={() => setRenaming(true)}>
          <PencilIcon className="size-4" aria-hidden />
          Renombrar
        </Button>

        <AlertDialog open={deleting} onOpenChange={(open) => !open && setDeleting(false)}>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Eliminar pizarra"
                className="text-destructive hover:text-destructive"
              />
            }
          >
            <Trash2Icon className="size-4" aria-hidden />
            Eliminar
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta pizarra?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borra &ldquo;{board.name}&rdquo; y todo su contenido. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={isPending}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={renaming} onOpenChange={(open) => !open && setRenaming(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renombrar pizarra</DialogTitle>
            <DialogDescription>Elegí un nuevo nombre para &ldquo;{board.name}&rdquo;.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="board-rename">Nombre</Label>
            <Input id="board-rename" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRename} disabled={isPending || !name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}
