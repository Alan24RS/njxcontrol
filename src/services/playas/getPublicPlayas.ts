'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { getPagination } from '@/utils/pagination'
import { generateTags } from '@/utils/queryParams'

import { getPlayaFilters } from './getPlayaFilters'
import { transformListPlaya } from './transformers'
import type { GetPlayasPublicasParams, PlayaPublica, RawPlaya } from './types'

export async function getPublicPlayas(
  args: GetPlayasPublicasParams
): Promise<ApiResponse<PlayaPublica[]>> {
  const tags = generateTags(args)

  return unstable_cache(
    async (): Promise<ApiResponse<PlayaPublica[]>> => {
      const supabase = createCachedClient()
      const { page, limit, skip } = getPagination(args)
      const { sortBy, includeFilters } = args

      let query = supabase
        .from('playa')
        .select(
          `
          *,
          ciudad:ciudad_id (
            ciudad_id,
            nombre,
            provincia
          )
        `,
          { count: 'exact' }
        )
        .eq('estado', 'ACTIVO')
        .is('fecha_eliminacion', null)

      if (sortBy) {
        query = query.order(sortBy[0], {
          ascending: true,
          nullsFirst: false
        })
      } else {
        query = query.order('fecha_creacion', { ascending: false })
      }

      let filters = undefined

      if (includeFilters) {
        const appliedFilters = extractAppliedFilters(args)
        const filtersResponse = await getPlayaFilters({
          appliedFilters
        })
        filters = filtersResponse.data || undefined
      }

      query = query.range(skip, skip + limit - 1)

      const { data, error, count } = await query.overrideTypes<
        RawPlaya[],
        { merge: false }
      >()

      const total = typeof count === 'number' ? count : 0
      const currentPageSize = limit
      const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

      return {
        data: transformListPlaya(data).map((playa) => ({
          id: playa.id,
          nombre: playa.nombre,
          direccion: playa.direccion,
          descripcion: playa.descripcion,
          horario: playa.horario,
          latitud: playa.latitud,
          longitud: playa.longitud,
          ciudadId: playa.ciudadId,
          estado: playa.estado
        })),
        error: error ? translateDBError(error.message) : null,
        pagination: {
          total,
          lastPage,
          currentPage: page
        },
        filters
      }
    },
    tags,
    {
      tags: [CACHE_TAGS.PLAYAS_PUBLICAS, ...tags],
      revalidate: CACHE_TIMES.PLAYAS_PUBLICAS
    }
  )()
}
