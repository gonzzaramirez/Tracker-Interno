import Link from "next/link"
import { LayoutDashboardIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutDashboardIcon />
          </EmptyMedia>
          <EmptyTitle>Página no encontrada</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            La página o el miembro del equipo que buscás no existe —
            puede que se haya eliminado o el enlace sea incorrecto.
          </EmptyDescription>
          <Button render={<Link href="/" />} className="mt-2">
            Volver al panel
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}