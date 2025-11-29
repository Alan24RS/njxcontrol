'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformRegistrarPagoBoleta } from './transformers'
import type {
  RawRegistrarPagoBoleta,
  RegistrarPagoBoletaParams,
  RegistrarPagoBoletaResponse
} from './types'

export async function registrarPagoBoleta(
  params: RegistrarPagoBoletaParams
): Promise<ApiResponse<RegistrarPagoBoletaResponse>> {
  try {
    const supabase = await createClient()

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'registrar_pago_boleta',
      {
        p_playa_id: params.playaId,
        p_plaza_id: params.plazaId,
        p_fecha_hora_inicio_abono: params.fechaHoraInicioAbono,
        p_fecha_generacion_boleta: params.fechaGeneracionBoleta,
        p_monto: params.monto,
        p_metodo_pago: params.metodoPago
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    const boletaData = rpcData?.boleta

    if (!boletaData) {
      return {
        data: null,
        error: 'No se pudo obtener la información de la boleta después del pago'
      }
    }

    const { data: boletaActualizada, error: boletaError } = await supabase
      .from('boleta')
      .select('monto_pagado, estado, monto')
      .eq('playa_id', params.playaId)
      .eq('plaza_id', params.plazaId)
      .eq('fecha_hora_inicio_abono', params.fechaHoraInicioAbono)
      .eq('fecha_generacion_boleta', params.fechaGeneracionBoleta)
      .single()

    if (boletaError || !boletaActualizada) {
      return {
        data: null,
        error:
          boletaError?.message ||
          'No se pudo obtener el estado actualizado de la boleta'
      }
    }

    const montoPagadoTotal = Number(boletaActualizada.monto_pagado || 0)
    const montoTotal = Number(boletaActualizada.monto || 0)
    const deudaPendiente = montoTotal - montoPagadoTotal

    const rawResponse: RawRegistrarPagoBoleta = {
      monto_pagado_total: montoPagadoTotal,
      deuda_pendiente: deudaPendiente,
      estado_boleta: boletaActualizada.estado || 'PENDIENTE'
    }

    return {
      data: transformRegistrarPagoBoleta(rawResponse),
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al registrar pago'
    }
  }
}
