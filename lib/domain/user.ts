/** Login account: a supervisor (tenant) or the dedicated Project Manager. */
export const USER_ROLES = ["supervisor", "pm"] as const

export type UserRole = (typeof USER_ROLES)[number]

export type User = {
  id: string
  username: string
  role: UserRole
  /** Cell name the supervisor chose (e.g. "Celula 5"); null when unset. */
  celula: string | null
  createdAt: string
}
