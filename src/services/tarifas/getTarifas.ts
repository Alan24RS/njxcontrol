'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getTarifaFilters } from './getTarifaFilters'
import { transformListTarifasFromView } from './transformers'
import type { GetTarifasParams, RawTarifaView, Tarifa } from './types'

// Mapeo de columnas del frontend a campos de la vista
const TARIFA_COLUMN_MAPPING = createColumnMapping({
  tipoPlaza: 'tipo_plaza_nombre',
  modalidadOcupacion: 'modalidad_ocupacion_order',
  tipoVehiculo: 'tipo_vehiculo_order',
  precioBase: 'precio_base',
  fechaCreacion: 'fecha_creacion'
} as const)

// Usar la vista v_tarifas que ya incluye los JOINs
const DEFAULT_SELECT = '*'

export async function getTarifas(
  args: GetTarifasParams
): Promise<ApiResponse<Tarifa[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const {
    playaId,
    sortBy,
    query: searchQuery,
    includeFilters,
    tipoPlaza,
    modalidadOcupacion,
    tipoVehiculo
  } = args

  let requestQuery = supabase
    .from('v_tarifas')
    .select(DEFAULT_SELECT, { count: 'exact' })
    .eq('playa_id', playaId)

  if (searchQuery) {
    requestQuery = requestQuery.or(
      `tipo_plaza_nombre.ilike.*${searchQuery}*,modalidad_ocupacion.ilike.*${searchQuery}*,tipo_vehiculo.ilike.*${searchQuery}*`
    )
  }

  if (tipoPlaza) {
    requestQuery = requestQuery.eq('tipo_plaza_id', tipoPlaza)
  }

  if (modalidadOcupacion) {
    requestQuery = requestQuery.eq('modalidad_ocupacion', modalidadOcupacion)
  }

  if (tipoVehiculo) {
    requestQuery = requestQuery.eq('tipo_vehiculo', tipoVehiculo)
  }

  requestQuery = applySorting(requestQuery, {
    sortBy,
    columnMapping: TARIFA_COLUMN_MAPPING,
    defaultSort: {
      column: 'fecha_creacion',
      direction: 'desc'
    }
  })

  let filters = undefined

  if (includeFilters) {
    const appliedFilters = extractAppliedFilters(args)
    const filtersResponse = await getTarifaFilters({
      query: searchQuery,
      appliedFilters: appliedFilters,
      playaId
    })
    filters = filtersResponse.data || undefined
  }

  requestQuery = requestQuery.range(skip, skip + limit - 1)

  const { data, error, count } = await requestQuery.overrideTypes<
    RawTarifaView[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const currentPageSize = limit
  const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

  return {
    data: transformListTarifasFromView(data),
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    },
    filters
  }
}
