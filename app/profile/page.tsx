import { ProfileForm } from "@/components/feature/profile-form"
import { requireAuth } from "@/lib/auth-guard"
import { getUserById } from "@/lib/db/repos/users"

export const metadata = {
  title: "Perfil",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ProfilePage() {
  const userId = await requireAuth()
  const user = await getUserById(userId)

  return (
    <ProfileForm
      username={user?.username ?? "Usuario"}
      role={user?.role ?? "supervisor"}
      initialCelula={user?.celula ?? ""}
    />
  )
}
