'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'

export function AuthStateHandler() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED') {
        router.refresh()
      }

      if (event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    supabase.auth.getSession().catch((error) => {
      if (
        error?.message?.includes('refresh_token_not_found') ||
        error?.message?.includes('Invalid Refresh Token')
      ) {
        supabase.auth.signOut({ scope: 'local' }).then(() => {
          router.refresh()
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
