'use server'

import { unstable_cache } from 'next/cache'

import { createClient } from '@supabase/supabase-js'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
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
      // Usar cliente público sin autenticación para datos públicos
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Consultar la vista v_playas_disponibilidad que calcula disponibilidad en tiempo real
      const { data, error } = await supabase
        .from('v_playas_disponibilidad')
        .select('*')
        .order('playa_nombre', { ascending: true })
        .order('tipo_plaza_nombre', { ascending: true })

      console.log(
        '🔍 Service - raw data from DB:',
        JSON.stringify(data, null, 2)
      )
      console.log('🔍 Service - error:', error)

      if (error) {
        console.error('❌ Service - DB error:', error)
        return {
          data: [],
          error: translateDBError(error.message)
        }
      }

      // Transformar datos: agrupar por playa y consolidar disponibilidad por tipo
      const playasConDisponibilidad = transformPlayaConDisponibilidad(
        data as unknown as RawPlayaConDisponibilidad[]
      )

      console.log(
        '🔍 Service - transformed data:',
        JSON.stringify(playasConDisponibilidad, null, 2)
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
