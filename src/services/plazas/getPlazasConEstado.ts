// Contenido completo de: src/services/plazas/getPlazasConEstado.ts
'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import type { PlazaConEstado } from './types'

export const getPlazasConEstado = cache(
  async (playaId: string): Promise<ApiResponse<PlazaConEstado[]>> => {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_plazas_con_estado', {
      p_playa_id: playaId
    })

    if (error) {
      console.error('Error fetching get_plazas_con_estado:', error)
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    return {
      data: data as PlazaConEstado[],
      error: null
    }
  }
)
