"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions/auth"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit(formData: FormData) {
    setError("")
    const u = (formData.get("username") as string) || username
    const p = (formData.get("password") as string) || password
    startTransition(async () => {
      const result = await loginAction(u, p)
      if (result.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <form action={submit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de seguimiento</p>
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="login-username">Usuario</Label>
          <Input id="login-username" name="username" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Contraseña</Label>
          <Input id="login-password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending || !username || !password}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden /> : <LogInIcon className="size-4" aria-hidden />}
          Ingresar
        </Button>
      </form>
    </div>
  )
}
