'use server'

import { createClient } from '@/lib/supabase/server'
import { transformListTipoVehiculoPlaya } from '@/services/tipos-vehiculo/transformers'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import type {
  GetTiposVehiculoParams,
  RawTipoVehiculoPlaya,
  TipoVehiculoPlaya
} from './types'

const TIPO_VEHICULO_COLUMN_MAPPING = createColumnMapping({
  tipo_vehiculo: 'tipo_vehiculo_nombre',
  tipoVehiculo: 'tipo_vehiculo_nombre',
  estado: 'estado',
  fechaCreacion: 'fecha_creacion',
  fecha_creacion: 'fecha_creacion'
} as const)

export async function getTiposVehiculo(
  args: GetTiposVehiculoParams
): Promise<ApiResponse<TipoVehiculoPlaya[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const { playaId, sortBy, estado } = args

  let requestQuery = supabase
    .from('v_tipos_vehiculo')
    .select('*', { count: 'exact' })

  if (playaId) {
    requestQuery = requestQuery.eq('playa_id', playaId)
  }

  if (estado) {
    requestQuery = requestQuery.eq('estado', estado)
  }

  requestQuery = applySorting(requestQuery, {
    sortBy,
    columnMapping: TIPO_VEHICULO_COLUMN_MAPPING,
    defaultSort: {
      column: 'fecha_creacion',
      direction: 'desc'
    }
  })

  requestQuery = requestQuery.range(skip, skip + limit - 1)

  const { data, error, count } = await requestQuery.overrideTypes<
    RawTipoVehiculoPlaya[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const lastPage = total > 0 ? Math.ceil(total / limit) : 1

  return {
    data: transformListTipoVehiculoPlaya(data),
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    }
  }
}
