"use client"

import { useState, useTransition } from "react"
import { MoreHorizontalIcon, PencilIcon, PowerIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { deactivateMemberAction, updateMemberAction } from "@/lib/actions/members"
import type { Member } from "@/lib/domain"
import { MemberForm } from "@/components/feature/member-form"

type MemberActionsProps = {
  member: Member
}

/**
 * Per-member actions: edit (inline form), deactivate/reactivate with a
 * confirmation dialog. Deactivation keeps the member's history intact.
 */
export function MemberActions({ member }: MemberActionsProps) {
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function deactivate() {
    setConfirmOpen(false)
    startTransition(async () => {
      const result = await deactivateMemberAction(member.id)
      if (result.ok) {
        toast.success("Miembro desactivado")
      } else {
        toast.error(result.error)
      }
    })
  }

  function reactivate() {
    startTransition(async () => {
      const result = await updateMemberAction(member.id, { status: "active" })
      if (result.ok) {
        toast.success("Miembro reactivado")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Acciones de ${member.name}`}>
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden />
            Editar
          </DropdownMenuItem>
          {member.status === "active" ? (
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger
                render={
                  <DropdownMenuItem variant="destructive" onClick={(event) => event.preventDefault()}>
                    <PowerIcon aria-hidden />
                    Desactivar
                  </DropdownMenuItem>
                }
              />
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desactivar a {member.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Lo sacás del roster activo y del calendario, pero su historial
                    (tareas, feedback, check-ins) se conserva intacto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={deactivate}
                    disabled={isPending}
                  >
                    Desactivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <DropdownMenuItem onClick={reactivate} disabled={isPending}>
              <RotateCcwIcon aria-hidden />
              Reactivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {editing ? (
        <MemberForm
          mode="edit"
          member={member}
          onDone={() => setEditing(false)}
        />
      ) : null}
    </>
  )
}
