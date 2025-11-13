'use server'

import { revalidatePath } from 'next/cache'

import type { TipoVehiculo } from '@/constants/tipoVehiculo'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type CreateTipoVehiculoPlayaData = {
  playaId: string
  tipoVehiculo: TipoVehiculo
}

export async function createTipoVehiculoPlaya(
  data: CreateTipoVehiculoPlayaData
): Promise<ApiResponse<null>> {
  const supabase = await createClient()

  const { error } = await supabase.from('tipo_vehiculo_playa').insert({
    playa_id: data.playaId,
    tipo_vehiculo: data.tipoVehiculo
  })

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/tipos-vehiculo')

  return {
    data: null,
    error: null
  }
}
