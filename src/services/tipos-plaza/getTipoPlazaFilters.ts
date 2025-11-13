'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'

export type GetTipoPlazaFiltersParams = {
  query?: string
  caracteristicas?: number[]
  playaId?: string
}

export async function getTipoPlazaFilters(
  params: GetTipoPlazaFiltersParams
): Promise<ApiResponse<Filters>> {
  const supabase = await createClient()

  try {
    const appliedFilters = extractAppliedFilters(params)

    const { data, error } = await supabase.rpc('get_tipo_plaza_filters', {
      search_query: params.query || null,
      applied_filters: appliedFilters,
      playa_id_param: params.playaId || null
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
  } catch (error) {
    console.error('Error getting tipo plaza filters:', error)
    return {
      data: null,
      error: 'Error inesperado al obtener los filtros'
    }
  }
}
