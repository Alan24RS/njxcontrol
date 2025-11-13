import { cache } from 'react'

import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import type { User } from '@/types/auth'

export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  )
})

export const getAuthenticatedUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'get_authenticated_user_with_roles'
    )

    if (error || !data || data.length === 0) {
      return null
    }

    const userData = data[0]

    return {
      id: userData.usuario_id,
      email: userData.email!,
      name: userData.nombre,
      phone: userData.telefono,
      roles: userData.roles || []
    }
  } catch {
    return null
  }
})
