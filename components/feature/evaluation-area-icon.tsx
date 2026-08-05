import {
  AwardIcon,
  ClipboardCheckIcon,
  MessagesSquareIcon,
  SmileIcon,
  UsersIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import type { EvaluationAreaId } from "@/lib/domain"

/** Lucide icon per evaluation area — shared by form, cards and evolution views. */
export const EVALUATION_AREA_ICONS: Record<EvaluationAreaId, LucideIcon> = {
  compliance: ClipboardCheckIcon,
  quality: AwardIcon,
  communication: MessagesSquareIcon,
  proactivity: ZapIcon,
  teamwork: UsersIcon,
  attitude: SmileIcon,
}
