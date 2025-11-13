'use server'

import { revalidatePath } from 'next/cache'

import { EstadoTipoVehiculo } from '@/constants/tipoVehiculo'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTipoVehiculoPlaya } from './transformers'
import type { RawTipoVehiculoPlaya, TipoVehiculoPlaya } from './types'

export type UpdateTipoVehiculoEstadoParams = {
  playaId: string
  tipoVehiculo: string
  estado: EstadoTipoVehiculo
}

export async function updateTipoVehiculoEstado(
  params: UpdateTipoVehiculoEstadoParams
): Promise<ApiResponse<TipoVehiculoPlaya>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tipo_vehiculo_playa')
    .update({
      estado: params.estado,
      fecha_modificacion: new Date().toISOString()
    })
    .eq('playa_id', params.playaId)
    .eq('tipo_vehiculo', params.tipoVehiculo)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  revalidatePath('/admin/tipos-vehiculo')

  return {
    data: transformTipoVehiculoPlaya(data as RawTipoVehiculoPlaya),
    error: null
  }
}
