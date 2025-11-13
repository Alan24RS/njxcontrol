'use server'

import { createClient } from '@/lib/supabase/server'
import { transformListMetodoPagoPlaya } from '@/services/metodos-pago-playa/transformers'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import type {
  GetMetodosPagoPlayaParams,
  MetodoPagoPlaya,
  RawMetodoPagoPlaya
} from './types'

const METODO_PAGO_COLUMN_MAPPING = createColumnMapping({
  metodo_pago: 'metodo_pago_label',
  metodoPago: 'metodo_pago_label',
  estado: 'estado',
  fechaCreacion: 'fecha_creacion',
  fecha_creacion: 'fecha_creacion'
} as const)

export async function getMetodosPagoPlaya(
  args: GetMetodosPagoPlayaParams
): Promise<ApiResponse<MetodoPagoPlaya[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const { playaId, sortBy } = args

  let requestQuery = supabase
    .from('v_metodos_pago_playa')
    .select('*', { count: 'exact' })
    .eq('playa_id', playaId)

  requestQuery = applySorting(requestQuery, {
    sortBy,
    columnMapping: METODO_PAGO_COLUMN_MAPPING,
    defaultSort: {
      column: 'fecha_creacion',
      direction: 'desc'
    }
  })

  requestQuery = requestQuery.range(skip, skip + limit - 1)

  const { data, error, count } = await requestQuery.overrideTypes<
    RawMetodoPagoPlaya[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const lastPage = total > 0 ? Math.ceil(total / limit) : 1

  return {
    data: transformListMetodoPagoPlaya(data),
    error: error ? translateDBError(error.message) : null,
    pagination: { total, lastPage, currentPage: page }
  }
}
