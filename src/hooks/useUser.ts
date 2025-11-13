'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/browser'
import type { User } from '@/types/auth'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc(
          'get_authenticated_user_with_roles'
        )

        if (error || !data || data.length === 0) {
          setUser(null)
          return
        }

        const userData = data[0]

        setUser({
          id: userData.usuario_id,
          email: userData.email!,
          name: userData.nombre,
          phone: userData.telefono,
          roles: userData.roles || []
        })
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, isLoading }
}
