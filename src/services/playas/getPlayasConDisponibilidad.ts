'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlayaConDisponibilidad } from './transformers'
import type { PlayaConDisponibilidad, RawPlayaConDisponibilidad } from './types'

/**
 * Obtiene playas públicas activas con información de disponibilidad de plazas por tipo
 * Esta información es pública y puede ser consumida sin autenticación
 *
 * @returns Lista de playas con disponibilidad detallada por tipo de plaza
 */
export async function getPlayasConDisponibilidad(): Promise<
  ApiResponse<PlayaConDisponibilidad[]>
> {
  return unstable_cache(
    async (): Promise<ApiResponse<PlayaConDisponibilidad[]>> => {
      const supabase = createCachedClient()

      // Consultar la vista v_playas_disponibilidad que calcula disponibilidad en tiempo real
      const { data, error } = await supabase
        .from('v_playas_disponibilidad')
        .select('*')
        .order('playa_nombre', { ascending: true })
        .order('tipo_plaza_nombre', { ascending: true })

      if (error) {
        return {
          data: [],
          error: translateDBError(error.message)
        }
      }

      // Transformar datos: agrupar por playa y consolidar disponibilidad por tipo
      const playasConDisponibilidad = transformPlayaConDisponibilidad(
        data as unknown as RawPlayaConDisponibilidad[]
      )

      return {
        data: playasConDisponibilidad,
        error: null
      }
    },
    ['playas-disponibilidad'],
    {
      tags: [CACHE_TAGS.PLAYAS_PUBLICAS, 'playas-disponibilidad'],
      revalidate: CACHE_TIMES.PLAZAS // 3 minutos - disponibilidad cambia frecuentemente
    }
  )()
}
