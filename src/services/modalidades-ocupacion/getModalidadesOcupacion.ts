'use server'

import { createClient } from '@/lib/supabase/server'
import { transformListModalidadOcupacion } from '@/services/modalidades-ocupacion/transformers'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { createColumnMapping, remapSort } from '@/utils/sortingUtils'

import type {
  GetModalidadesOcupacionParams,
  ModalidadOcupacionPlaya,
  RawModalidadOcupacionPlaya
} from './types'

const MODALIDAD_COLUMN_MAPPING = createColumnMapping({
  modalidad_ocupacion: 'modalidad_nombre',
  estado: 'estado',
  fecha_creacion: 'fecha_creacion',
  modalidadOcupacion: 'modalidad_nombre',
  creado: 'fecha_creacion',
  fecha: 'fecha_creacion',
  m: 'modalidad_nombre',
  e: 'estado',
  f: 'fecha_creacion'
})

export async function getModalidadesOcupacion(
  args: GetModalidadesOcupacionParams
): Promise<ApiResponse<ModalidadOcupacionPlaya[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const { playaId, sortBy } = args

  const safeSort = remapSort(sortBy, MODALIDAD_COLUMN_MAPPING)

  let query = supabase
    .from('v_modalidades_ocupacion')
    .select('*', { count: 'exact' })
    .eq('playa_id', playaId)

  if (safeSort) {
    const [col, dir] = safeSort.split(' ')
    const asc = dir?.toLowerCase() !== 'desc'

    query = query.order(col, { ascending: asc, nullsFirst: false })
  } else {
    query = query.order('fecha_creacion', { ascending: false })
  }

  query = query.range(skip, skip + limit - 1)

  const { data, error, count } = await query.overrideTypes<
    RawModalidadOcupacionPlaya[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const currentPageSize = limit
  const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

  return {
    data: transformListModalidadOcupacion(data),
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    }
  }
}
