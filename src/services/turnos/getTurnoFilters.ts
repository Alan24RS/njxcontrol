'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type GetTurnoFiltersParams = {
  playaId: string
  appliedFilters?: Record<string, string[]>
}

export const getTurnoFilters = async (
  args: GetTurnoFiltersParams
): Promise<ApiResponse<Filters>> => {
  const filtersKey = args.appliedFilters
    ? JSON.stringify(args.appliedFilters)
    : 'none'
  const cacheKey = `turno-filters-${args.playaId}-${filtersKey}`

  return unstable_cache(
    async (): Promise<ApiResponse<Filters>> => {
      const supabase = createCachedClient()

      try {
        // Obtener todas las playas del usuario (dueño)
        const { data: playasRaw, error: playasError } = await supabase
          .from('playa')
          .select('playa_id, nombre')
          .eq('estado', 'ACTIVO')
          .order('nombre')

        if (playasError) {
          return {
            data: null,
            error: translateDBError(playasError.message)
          }
        }

        // Construir filtros
        const filters: Filters = {
          playa: {
            title: 'Playa',
            options:
              playasRaw?.map((p) => ({
                label: p.nombre || 'Sin nombre',
                value: p.playa_id
              })) || []
          },
          date: {
            title: 'Rango de fechas',
            options: []
          }
        }

        return {
          data: filters,
          error: null
        }
      } catch {
        return {
          data: null,
          error: 'Error al obtener filtros de turnos'
        }
      }
    },
    [cacheKey],
    {
      tags: [CACHE_TAGS.TURNOS, cacheKey],
      revalidate: CACHE_TIMES.TURNOS
    }
  )()
}
