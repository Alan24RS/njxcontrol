'use server'

import { createClient } from '@/lib/supabase/server'

import type { FinalizarAbonoResponse } from './types'

export async function finalizarAbono(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<{
  data: FinalizarAbonoResponse | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('finalizar_abono', {
      p_playa_id: playaId,
      p_plaza_id: plazaId,
      p_fecha_hora_inicio: fechaHoraInicio
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return {
      data: {
        success: true,
        message: 'Abono finalizado exitosamente'
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al finalizar abono'
    }
  }
}
