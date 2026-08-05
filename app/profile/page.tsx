"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { KeyRoundIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePasswordAction } from "@/lib/actions/auth"

export default function ProfilePage() {
  const [current, setCurrent] = useState("")
  const [newPw, setNewPw] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
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
        <p className="mt-1 text-sm text-muted-foreground">Cambiá tu contraseña.</p>
      </div>

      <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-current">Contraseña actual</Label>
          <Input id="profile-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-new">Nueva contraseña</Label>
          <Input id="profile-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 4 caracteres" />
        </div>
        <Button onClick={submit} disabled={isPending || !current || !newPw}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden /> : <KeyRoundIcon className="size-4" aria-hidden />}
          Cambiar contraseña
        </Button>
      </div>
    </div>
  )
}
