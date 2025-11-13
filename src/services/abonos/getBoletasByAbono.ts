'use server'

import { createClient } from '@/lib/supabase/server'

import { transformListBoleta } from './transformers'
import type { Boleta, RawBoleta } from './types'

export async function getBoletasByAbono(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<{
  data: Boleta[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('v_boletas')
      .select('*')
      .eq('playa_id', playaId)
      .eq('plaza_id', plazaId)
      .eq('fecha_hora_inicio_abono', fechaHoraInicio)
      .order('fecha_generacion_boleta', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: transformListBoleta(data as RawBoleta[]), error: null }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Error al obtener boletas del abono'
    }
  }
}
