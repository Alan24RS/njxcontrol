'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTurno } from './transformers'
import { DEFAULT_SELECT, RawTurno, Turno } from './types'

interface GetTurnoParams {
  activo?: boolean
  playaId?: string
  playeroId?: string
}

export const getTurno = cache(
  async (params?: GetTurnoParams): Promise<ApiResponse<Turno>> => {
    const supabase = await createClient()

    const { activo, playaId, playeroId } = params ?? {}

    let query = supabase.from('turno').select(DEFAULT_SELECT)

    if (activo) query = query.is('fecha_hora_salida', null)

    if (playaId) query = query.eq('playa_id', playaId)

    if (playeroId) query = query.eq('playero_id', playeroId)

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      return {
        data: null,
        error: translateDBError(error?.message)
      }
    }

    return { data: transformTurno(data as unknown as RawTurno), error: null }
  }
)
