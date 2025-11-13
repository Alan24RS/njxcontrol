'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformOcupacionVista } from './transformers'
import type { OcupacionConRelaciones, RawOcupacionVista } from './types'

/**
 * Obtiene una ocupación por su ID con todas sus relaciones
 *
 * Usa React cache() para deduplicación automática de requests durante el render
 * de Server Components. Múltiples componentes pueden llamar a esta función con el
 * mismo ID sin generar queries duplicadas.
 *
 * @param ocupacionId - ID de la ocupación
 * @returns ApiResponse con la ocupación y sus relaciones o error
 */
export const getOcupacionById = cache(
  async (ocupacionId: string): Promise<ApiResponse<OcupacionConRelaciones>> => {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('v_ocupaciones')
        .select('*')
        .eq('ocupacion_id', ocupacionId)
        .single()

      if (error) {
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      if (!data) {
        return {
          data: null,
          error: 'Ocupación no encontrada'
        }
      }

      const ocupacion = transformOcupacionVista(data as RawOcupacionVista)

      return {
        data: ocupacion,
        error: null
      }
    } catch {
      return {
        data: null,
        error: 'Error al obtener la ocupación'
      }
    }
  }
)
