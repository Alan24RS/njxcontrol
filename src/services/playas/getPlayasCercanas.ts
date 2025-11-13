'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListPlayaPublica } from './transformers'
import type { PlayaPublica, RawPlaya } from './types'

export async function getPlayasCercanas({
  latitud,
  longitud,
  radio = 5000 // radio en metros, por defecto 5km
}: {
  latitud: number
  longitud: number
  radio?: number
}): Promise<ApiResponse<PlayaPublica[]>> {
  const cacheKey = `playas-cercanas-${latitud}-${longitud}-${radio}`

  return unstable_cache(
    async (): Promise<ApiResponse<PlayaPublica[]>> => {
      const supabase = createCachedClient()

      try {
        // Calcular las coordenadas aproximadas del bounding box
        // 1 grado de latitud ≈ 111 km
        // 1 grado de longitud ≈ 111 km * cos(latitud)
        const kmRadius = radio / 1000
        const latDelta = kmRadius / 111
        const lngDelta = kmRadius / (111 * Math.cos((latitud * Math.PI) / 180))

        const { data, error } = await supabase
          .from('playa_publica')
          .select('*')
          .not('latitud', 'is', null)
          .not('longitud', 'is', null)
          .gte('latitud', latitud - latDelta)
          .lte('latitud', latitud + latDelta)
          .gte('longitud', longitud - lngDelta)
          .lte('longitud', longitud + lngDelta)

        if (error) {
          return {
            data: null,
            error: translateDBError(error.message)
          }
        }

        if (!data) {
          return {
            data: [],
            error: null
          }
        }

        // Filtrar por distancia exacta usando la fórmula de Haversine
        const playasFiltradas = data.filter((playa) => {
          if (!playa.latitud || !playa.longitud) return false

          const distancia = calcularDistancia(
            latitud,
            longitud,
            playa.latitud,
            playa.longitud
          )

          return distancia <= radio
        })

        return {
          data: transformListPlayaPublica(playasFiltradas as RawPlaya[]),
          error: null
        }
      } catch (error) {
        return {
          data: null,
          error:
            error instanceof Error
              ? error.message
              : 'Error desconocido al obtener playas cercanas'
        }
      }
    },
    [cacheKey],
    {
      tags: [CACHE_TAGS.PLAYAS_CERCANAS, cacheKey],
      revalidate: CACHE_TIMES.PLAYAS_CERCANAS
    }
  )()
}

// Función para calcular distancia usando la fórmula de Haversine
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distancia en metros
}
