'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function getUnavailablePlazaIds(
  playaId: string
): Promise<ApiResponse<string[]>> {
  const supabase = await createClient()

  const { data: plazasOcupadas, error: ocupadasError } = await supabase
    .from('ocupacion')
    .select('plaza_id')
    .eq('playa_id', playaId)
    .is('hora_egreso', null)

  if (ocupadasError) {
    return {
      data: null,
      error: translateDBError(ocupadasError.message)
    }
  }

  const { data: plazasConAbono, error: abonosError } = await supabase
    .from('abono')
    .select('plaza_id')
    .eq('playa_id', playaId)
    .eq('estado', 'ACTIVO')

  if (abonosError) {
    return {
      data: null,
      error: translateDBError(abonosError.message)
    }
  }

  return {
    data: [
      ...(plazasOcupadas || []).map((o) => o.plaza_id),
      ...(plazasConAbono || []).map((a) => a.plaza_id)
    ],
    error: null
  }
}
