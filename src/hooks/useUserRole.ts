'use client'

import type { Role } from '@/constants/rol'
import { hasAnyRole, hasRole } from '@/lib/auth/roles'

import { useUser } from './useUser'

export function useUserRole() {
  const { user, isLoading } = useUser()

  return {
    user,
    isLoading,
    hasRole: (role: Role) => hasRole(user, role),
    hasAnyRole: (roles: Role[]) => hasAnyRole(user, roles),
    isDueno: () => hasRole(user, 'DUENO'),
    isPlayero: () => hasRole(user, 'PLAYERO')
  }
}
