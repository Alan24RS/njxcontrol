'use server'

import { createClient } from '@/lib/supabase/server'

import { transformRegistrarPagoBoleta } from './transformers'
import type {
  RawRegistrarPagoBoleta,
  RegistrarPagoBoletaParams,
  RegistrarPagoBoletaResponse
} from './types'

export async function registrarPagoBoleta(
  params: RegistrarPagoBoletaParams
): Promise<{
  data: RegistrarPagoBoletaResponse | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('registrar_pago_boleta', {
      p_playa_id: params.playaId,
      p_plaza_id: params.plazaId,
      p_fecha_hora_inicio_abono: params.fechaHoraInicioAbono,
      p_fecha_generacion_boleta: params.fechaGeneracionBoleta,
      p_monto: params.monto,
      p_metodo_pago: params.metodoPago
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return {
      data: transformRegistrarPagoBoleta(data as RawRegistrarPagoBoleta),
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al registrar pago'
    }
  }
}
