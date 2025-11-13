'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function checkIfOwnerIsPlayero(): Promise<
  ApiResponse<{ isPlayero: boolean }>
> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    const { data, error } = await supabase.rpc('verificar_dueno_es_playero', {
      p_dueno_id: user.id
    })

    if (error) {
      console.error('Error checking if owner is playero:', error)
      return { data: null, error: 'Error al verificar estado de playero' }
    }

    return {
      data: { isPlayero: data || false },
      error: null
    }
  } catch (error) {
    console.error('Error checking if owner is playero:', error)
    return { data: null, error: 'Error inesperado' }
  }
}
