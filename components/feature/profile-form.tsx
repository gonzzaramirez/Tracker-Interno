"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { KeyRoundIcon, Loader2Icon, NetworkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePasswordAction } from "@/lib/actions/auth"
import { updateCelulaAction } from "@/lib/actions/profile"
import type { UserRole } from "@/lib/domain"

type ProfileFormProps = {
  username: string
  role: UserRole
  initialCelula: string
}

/**
 * Profile settings: cell name (shown to the PM) and password change.
 * The cell section is supervisor-only — the PM has no cell of their own.
 */
export function ProfileForm({ username, role, initialCelula }: ProfileFormProps) {
  const [celula, setCelula] = useState(initialCelula)
  const [current, setCurrent] = useState("")
  const [newPw, setNewPw] = useState("")
  const [isPending, startTransition] = useTransition()

  function saveCelula() {
    startTransition(async () => {
      const result = await updateCelulaAction(celula)
      if (result.ok) {
        toast.success(result.celula ? `Célula guardada: ${result.celula}` : "Célula eliminada")
        setCelula(result.celula ?? "")
      } else {
        toast.error(result.error)
      }
    })
  }

  function submitPassword() {
    startTransition(async () => {
      const result = await changePasswordAction(current, newPw)
      if (result.ok) {
        toast.success("Contraseña actualizada")
        setCurrent("")
        setNewPw("")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 pt-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {username} — definí el nombre de tu célula y cambiá tu contraseña.
        </p>
      </div>

      {role === "supervisor" ? (
        <section aria-labelledby="profile-celula-heading" className="space-y-4 rounded-2xl bg-muted/40 p-4">
          <div>
            <h2 id="profile-celula-heading" className="text-sm font-semibold text-foreground">
              Célula
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              El nombre que ve la Project Manager junto a tu equipo (ej: “Celula 5”).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-celula">Nombre de la célula</Label>
            <Input
              id="profile-celula"
              value={celula}
              onChange={(event) => setCelula(event.target.value)}
              placeholder="Celula 5"
              maxLength={40}
            />
          </div>
          <Button onClick={saveCelula} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden />
            ) : (
              <NetworkIcon className="size-4" aria-hidden />
            )}
            Guardar célula
          </Button>
        </section>
      ) : null}

      <section aria-labelledby="profile-password-heading" className="space-y-4 rounded-2xl bg-muted/40 p-4">
        <div>
          <h2 id="profile-password-heading" className="text-sm font-semibold text-foreground">
            Contraseña
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cambiá tu contraseña de acceso.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-current">Contraseña actual</Label>
          <Input id="profile-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-new">Nueva contraseña</Label>
          <Input id="profile-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 4 caracteres" />
        </div>
        <Button onClick={submitPassword} disabled={isPending || !current || !newPw}>
          {isPending ? (
            <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden />
          ) : (
            <KeyRoundIcon className="size-4" aria-hidden />
          )}
          Cambiar contraseña
        </Button>
      </section>
    </div>
  )
}
