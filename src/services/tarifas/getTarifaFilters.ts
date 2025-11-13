'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type GetTarifaFiltersParams = {
  query?: string
  appliedFilters?: Record<string, string[]>
  playaId?: string
}

export const getTarifaFilters = async (
  args: GetTarifaFiltersParams = {}
): Promise<ApiResponse<Filters>> => {
  const filtersKey = args.appliedFilters
    ? JSON.stringify(args.appliedFilters)
    : 'none'
  const cacheKey = `tarifa-filters-${args.query || 'all'}-${args.playaId || 'all'}-${filtersKey}`

  return unstable_cache(
    async (): Promise<ApiResponse<Filters>> => {
      const supabase = createCachedClient()

      const { data, error } = await supabase.rpc('get_tarifa_filters', {
        search_query: args.query || null,
        applied_filters: args.appliedFilters || {},
        playa_id_param: args.playaId || null
      })

      if (error) {
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      return {
        data: data as Filters,
        error: null
      }
    },
    [cacheKey],
    {
      tags: [CACHE_TAGS.TARIFAS, cacheKey],
      revalidate: CACHE_TIMES.TARIFAS
    }
  )()
}
