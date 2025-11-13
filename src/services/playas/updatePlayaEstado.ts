import { revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/constants/cache'
import { PlayaEstado } from '@/constants/playaEstado'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaya } from './transformers'
import type { Playa, RawPlaya } from './types'

const DEFAULT_SELECT = `
*,
ciudad:ciudad_id (
  ciudad_id,
  nombre,
  provincia
)
`

export const updatePlayaEstado = async (
  playaId: string,
  estado: PlayaEstado
): Promise<ApiResponse<Playa | null>> => {
  const supabase = await createClient()

  const { data: playaData, error } = await supabase
    .from('playa')
    .update({ estado })
    .eq('playa_id', playaId)
    .is('fecha_eliminacion', null)
    .select(DEFAULT_SELECT)
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  revalidateTag(CACHE_TAGS.PLAYAS)
  revalidateTag(`playa-${playaId}`)

  if (!playaData) {
    return {
      data: null,
      error: 'No se pudo actualizar el estado de la playa'
    }
  }

  return {
    data: transformPlaya(playaData as RawPlaya),
    error: null
  }
}
