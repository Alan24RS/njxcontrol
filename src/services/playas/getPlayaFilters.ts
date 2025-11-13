'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type GetPlayaFiltersParams = {
  query?: string
  appliedFilters?: Record<string, string[]>
}

export const getPlayaFilters = async (
  args: GetPlayaFiltersParams = {}
): Promise<ApiResponse<Filters>> => {
  const filtersKey = args.appliedFilters
    ? JSON.stringify(args.appliedFilters)
    : 'none'
  const cacheKey = `playa-filters-${args.query || 'all'}-${filtersKey}`

  return unstable_cache(
    async (): Promise<ApiResponse<Filters>> => {
      const supabase = createCachedClient()

      const { data, error } = await supabase.rpc('get_playa_filters', {
        search_query: args.query || null,
        applied_filters: args.appliedFilters || {}
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
      tags: [CACHE_TAGS.PLAYAS, cacheKey],
      revalidate: CACHE_TIMES.PLAYAS
    }
  )()
}
