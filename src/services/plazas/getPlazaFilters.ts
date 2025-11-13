'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type GetPlazaFiltersParams = {
  query?: string
  appliedFilters?: Record<string, string[]>
  playaId?: string
}

export const getPlazaFilters = async (
  args: GetPlazaFiltersParams = {}
): Promise<ApiResponse<Filters>> => {
  const filtersKey = args.appliedFilters
    ? JSON.stringify(args.appliedFilters)
    : 'none'
  const cacheKey = `plaza-filters-${args.query || 'all'}-${args.playaId || 'all'}-${filtersKey}`

  return unstable_cache(
    async (): Promise<ApiResponse<Filters>> => {
      const supabase = createCachedClient()

      const { data, error } = await supabase.rpc('get_plaza_filters', {
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
      tags: [CACHE_TAGS.PLAZAS, cacheKey],
      revalidate: CACHE_TIMES.PLAZAS
    }
  )()
}
