'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaya } from './transformers'
import type { PlayaBasica } from './types'

const DEFAULT_SELECT = '*'

export const getPlaya = cache(
  async (playaId: string): Promise<ApiResponse<PlayaBasica | null>> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('v_playas')
      .select(DEFAULT_SELECT)
      .eq('playa_id', playaId)
      .is('fecha_eliminacion', null)
      .single()

    if (error || !data) {
      return {
        data: null,
        error: translateDBError(error?.message || 'Error desconocido')
      }
    }

    return {
      data: transformPlaya(data),
      error: null
    }
  }
)
