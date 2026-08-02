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
          <EmptyTitle>Page not found</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            The page or team member you&apos;re looking for doesn&apos;t exist —
            it may have been removed or the link is wrong.
          </EmptyDescription>
          <Button render={<Link href="/" />} className="mt-2">
            Back to overview
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}