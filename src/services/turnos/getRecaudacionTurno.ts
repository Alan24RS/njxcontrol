'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function getRecaudacionTurno(
  playaId: string,
  turnoFechaHoraIngreso: string
): Promise<ApiResponse<number>> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_recaudacion_turno', {
    p_playa_id: playaId,
    p_turno_fecha_hora_ingreso: turnoFechaHoraIngreso
  })

  if (error) {
    return {
      data: null,
      error: 'Error al obtener la recaudación del turno'
    }
  }

  return { data, error: null }
}
