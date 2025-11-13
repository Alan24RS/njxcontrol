'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export const deleteTurno = async (
  playaId: string,
  playeroId: string,
  fechaHoraIngreso: string
): Promise<ApiResponse<boolean>> => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('turno')
    .delete()
    .eq('playa_id', playaId)
    .eq('playero_id', playeroId)
    .eq('fecha_hora_ingreso', fechaHoraIngreso)

  if (error) {
    return {
      data: false,
      error: translateDBError(error?.message || 'Error desconocido')
    }
  }

  return { data: true, error: null }
}
