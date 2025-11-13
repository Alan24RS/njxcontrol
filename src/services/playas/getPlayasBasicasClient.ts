'use client'

import { createClient } from '@/lib/supabase/browser'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListPlaya } from './transformers'
import type { GetPlayasParams, PlayaBasica, RawPlaya } from './types'

const DEFAULT_SELECT = `
playa_id,
nombre,
direccion,
descripcion
`

export async function getPlayasBasicasClient(
  args: GetPlayasParams = {}
): Promise<ApiResponse<PlayaBasica[]>> {
  const supabase = createClient()
  const { query } = args

  let requestQuery = supabase
    .from('playa')
    .select(DEFAULT_SELECT)
    .is('fecha_eliminacion', null)

  if (query) {
    requestQuery = requestQuery.or(
      `descripcion.ilike.*${query}*,direccion.ilike.*${query}*,nombre.ilike.*${query}*`
    )
  }

  requestQuery = requestQuery.order('fecha_creacion', { ascending: false })

  const { data, error } = await requestQuery.overrideTypes<
    RawPlaya[],
    { merge: false }
  >()

  return {
    data: transformListPlaya(data) as PlayaBasica[],
    error: error ? translateDBError(error.message) : null
  }
}
