'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getPlayaFilters } from './getPlayaFilters'
import { transformListPlaya } from './transformers'
import type { GetPlayasParams, Playa, RawPlaya } from './types'

const PLAYA_COLUMN_MAPPING = createColumnMapping({
  name: 'nombre',
  address: 'direccion',
  description: 'descripcion',
  ciudad: 'ciudad_nombre',
  estado: 'estado'
} as const)

const DEFAULT_SELECT = '*'

export const getPlayas = cache(
  async (
    args: GetPlayasParams = { page: 1, limit: 100 }
  ): Promise<ApiResponse<Playa[]>> => {
    const supabase = await createClient()
    const { page, limit, skip } = getPagination(args)
    const {
      sortBy,
      query,
      select = DEFAULT_SELECT,
      includeFilters,
      estado,
      ciudad // 👈 NUEVO: recibimos filtro de ciudad (string o string[])
    } = args

    let requestQuery = supabase
      .from('v_playas')
      .select(select, { count: 'exact' })
      .is('fecha_eliminacion', null)

    if (query) {
      requestQuery = requestQuery.or(
        `descripcion.ilike.*${query}*,direccion.ilike.*${query}*,nombre.ilike.*${query}*`
      )
    }

    if (estado) {
      if (Array.isArray(estado)) {
        requestQuery = requestQuery.in('estado', estado)
      } else {
        requestQuery = requestQuery.eq('estado', estado)
      }
    }

    // 👇 NUEVO: aplicar filtro de ciudad sobre playa.ciudad_id
    if (ciudad) {
      if (Array.isArray(ciudad)) {
        requestQuery = requestQuery.in('ciudad_id', ciudad)
      } else {
        requestQuery = requestQuery.eq('ciudad_id', ciudad)
      }
    }

    requestQuery = applySorting(requestQuery, {
      sortBy,
      columnMapping: PLAYA_COLUMN_MAPPING,
      defaultSort: { column: 'fecha_creacion', direction: 'desc' }
    })

    // ---- filtros de la UI (para el panel lateral) ----
    let filters = undefined
    if (includeFilters) {
      const appliedFilters = extractAppliedFilters(args)
      const filtersResponse = await getPlayaFilters({
        query,
        appliedFilters
      })
      filters = filtersResponse.data || undefined
    }

    requestQuery = requestQuery.range(skip, skip + limit - 1)

    const { data, error, count } = await requestQuery.overrideTypes<
      RawPlaya[],
      { merge: false }
    >()

    const total = typeof count === 'number' ? count : 0
    const currentPageSize = limit
    const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

    return {
      data: transformListPlaya(data),
      error: error ? translateDBError(error.message) : null,
      pagination: {
        total,
        lastPage,
        currentPage: page
      },
      filters
    }
  }
)
