import type { Role } from '@/constants/rol'
import type { User } from '@/types/auth'

export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false
  return user.roles.includes(role)
}

export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false
  return roles.some((role) => user.roles.includes(role))
}

export function hasAllRoles(user: User | null, roles: Role[]): boolean {
  if (!user) return false
  return roles.every((role) => user.roles.includes(role))
}

export function isDueno(user: User | null): boolean {
  return hasRole(user, 'DUENO')
}

export function isPlayero(user: User | null): boolean {
  return hasRole(user, 'PLAYERO')
}
