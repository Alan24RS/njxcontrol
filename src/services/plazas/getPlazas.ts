'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getPlazaFilters } from './getPlazaFilters'
import { getUnavailablePlazaIds } from './helpers'
import { transformListPlazaFromView } from './transformers'
import type { GetPlazasParams, Plaza, RawPlazaView } from './types'

// Mapeo de columnas del frontend a campos de la vista
const PLAZA_COLUMN_MAPPING = createColumnMapping({
  identificador: 'identificador',
  estado: 'plaza_estado',
  tipoPlaza: 'tipo_plaza_nombre',
  playa: 'playa_direccion',
  fechaCreacion: 'fecha_creacion'
} as const)

// Usar la vista v_plazas que ya incluye los JOINs
const DEFAULT_SELECT = '*'

export const getPlazas = cache(
  async (args: GetPlazasParams): Promise<ApiResponse<Plaza[]>> => {
    const supabase = await createClient()
    const { page, limit, skip } = getPagination(args)
    const {
      sortBy,
      query: searchQuery,
      select = DEFAULT_SELECT,
      includeFilters,
      playaId,
      tipoPlaza,
      estado,
      onlyAvailable
    } = args

    let unavailablePlazaIds: string[] = []
    if (onlyAvailable && playaId) {
      const result = await getUnavailablePlazaIds(playaId)
      if (result.error) {
        return { data: null, error: result.error }
      }
      unavailablePlazaIds = result.data || []
    }

    let requestQuery = supabase
      .from('v_plazas')
      .select(select, { count: 'exact' })

    if (searchQuery) {
      requestQuery = requestQuery.or(`identificador.ilike.*${searchQuery}*`)
    }

    if (playaId) {
      requestQuery = requestQuery.eq('playa_id', playaId)
    }

    if (tipoPlaza) {
      requestQuery = requestQuery.eq('tipo_plaza_id', tipoPlaza)
    }

    if (estado) {
      requestQuery = requestQuery.eq('plaza_estado', estado)
    }

    if (onlyAvailable && unavailablePlazaIds.length > 0) {
      requestQuery = requestQuery.not(
        'plaza_id',
        'in',
        `(${unavailablePlazaIds.join(',')})`
      )
    }

    requestQuery = applySorting(requestQuery, {
      sortBy,
      columnMapping: PLAZA_COLUMN_MAPPING,
      defaultSort: {
        column: 'fecha_creacion',
        direction: 'desc'
      }
    })

    let filters = undefined

    if (includeFilters) {
      const appliedFilters = extractAppliedFilters(args)
      const filtersResponse = await getPlazaFilters({
        query: searchQuery,
        appliedFilters: appliedFilters,
        playaId
      })
      filters = filtersResponse.data || undefined
    }

    requestQuery = requestQuery.range(skip, skip + limit - 1)

    const { data, error, count } = await requestQuery.overrideTypes<
      RawPlazaView[],
      { merge: false }
    >()

    const total = typeof count === 'number' ? count : 0
    const currentPageSize = limit
    const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

    return {
      data: transformListPlazaFromView(data),
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
