'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import type { UpdateAbonoParams, UpdateAbonoResponse } from './types'

export async function updateAbono(
  params: UpdateAbonoParams
): Promise<ApiResponse<UpdateAbonoResponse>> {
  try {
    const supabase = await createClient()

    const rpcParams: Record<string, any> = {
      p_playa_id: params.playaId,
      p_plaza_id: params.plazaId,
      p_fecha_hora_inicio: params.fechaHoraInicio
    }

    if (
      params.nuevaPatente !== undefined &&
      params.nuevaPatente !== null &&
      params.nuevaPatente !== ''
    ) {
      rpcParams.p_nueva_patente = params.nuevaPatente.toUpperCase()
    }

    if (
      params.nuevoTipoVehiculo !== undefined &&
      params.nuevoTipoVehiculo !== null
    ) {
      rpcParams.p_nuevo_tipo_vehiculo = params.nuevoTipoVehiculo
    }

    if (params.nuevaPlazaId !== undefined && params.nuevaPlazaId !== null) {
      rpcParams.p_nueva_plaza_id = params.nuevaPlazaId
    }

    if (params.observaciones !== undefined && params.observaciones !== null) {
      rpcParams.p_observaciones = params.observaciones
    }

    const { data, error } = await supabase.rpc(
      'update_abono_details',
      rpcParams
    )

    if (error) {
      console.error('RPC error:', error)
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se recibió respuesta del servidor'
      }
    }

    if (!data.success) {
      return {
        data: null,
        error: data.mensaje || 'Error al actualizar el abono'
      }
    }

    const response: UpdateAbonoResponse = {
      success: data.success,
      abono_id: {
        playa_id: data.abono_id.playa_id,
        plaza_id: data.abono_id.plaza_id,
        fecha_hora_inicio: data.abono_id.fecha_hora_inicio
      },
      mensaje: data.mensaje,
      precio_mensual_anterior: data.precio_mensual_anterior ?? null,
      precio_mensual_nuevo: data.precio_mensual_nuevo ?? null
    }

    return {
      data: response,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al actualizar el abono'
    }
  }
}
