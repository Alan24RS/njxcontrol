'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { transformListPlayeroPlaya } from './transformers'
import type { GetPlayerosParams, PlayeroPlaya, RawPlayeroPlaya } from './types'

const PLAYERO_COLUMN_MAPPING = createColumnMapping({
  nombre: 'usuario_nombre',
  email: 'email',
  telefono: 'usuario_telefono',
  fechaAlta: 'fecha_alta',
  estado: 'estado'
} as const)

const DEFAULT_SELECT = '*'

export async function getPlayeros(
  args: GetPlayerosParams
): Promise<ApiResponse<PlayeroPlaya[]>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  const { page, limit, skip } = getPagination(args)
  const { query: searchQuery, sortBy } = args

  let requestQuery = supabase
    .from('v_playeros')
    .select(DEFAULT_SELECT, { count: 'exact' })
    .eq('dueno_invitador_id', user?.id)

  if (searchQuery) {
    requestQuery = requestQuery.or(
      `usuario_nombre.ilike.*${searchQuery}*,email.ilike.*${searchQuery}*`
    )
  }

  requestQuery = applySorting(requestQuery, {
    sortBy,
    columnMapping: PLAYERO_COLUMN_MAPPING,
    defaultSort: { column: 'fecha_alta', direction: 'desc' }
  })

  requestQuery = requestQuery.range(skip, skip + limit - 1)

  const { data, error, count } = await requestQuery.overrideTypes<
    RawPlayeroPlaya[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const currentPageSize = limit
  const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

  return {
    data: transformListPlayeroPlaya(data),
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    }
  }
}
