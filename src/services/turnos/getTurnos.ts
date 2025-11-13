'use server'
import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SELECT, RawTurno, type Turno } from '@/services/turnos/types'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListTurno } from './transformers'

// Obtener todos los turnos de un playero (o de una playa)
export const getTurnos = cache(
  async (params?: {
    playaId?: string | undefined
    fromDate?: string | undefined
    toDate?: string | undefined
  }): Promise<ApiResponse<Turno[]>> => {
    const supabase = await createClient()

    let query = supabase.from('turno').select(DEFAULT_SELECT)

    if (params?.playaId) query = query.eq('playa_id', params.playaId)

    if (params?.fromDate) {
      // assume fromDate is ISO date (YYYY-MM-DD)
      query = query.gte('fecha_hora_ingreso', params.fromDate)
    }

    if (params?.toDate) {
      // include end of day for toDate
      const to = params.toDate
      query = query.lte('fecha_hora_ingreso', `${to}T23:59:59`)
    }

    // ordenar por fecha de ingreso descendente
    query = query.order('fecha_hora_ingreso', { ascending: false })

    const { data, error } = await query

    if (error || !data) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    return {
      data: transformListTurno(data as unknown as RawTurno[]),
      error: null
    }
  }
)
