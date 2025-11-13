'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTarifaWithTipoPlaza } from './transformers'
import type { RawTarifaWithTipoPlaza, Tarifa } from './types'

export async function getTarifa(
  playaId: string,
  tipoPlazaId: number,
  modalidadOcupacion: string,
  tipoVehiculo: string
): Promise<ApiResponse<Tarifa>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tarifa')
    .select(
      `
      playa_id,
      tipo_plaza_id,
      modalidad_ocupacion,
      tipo_vehiculo,
      precio_base,
      fecha_creacion,
      fecha_modificacion,
      tipo_plaza!tarifa_tipo_plaza_fkey(
        nombre,
        descripcion
      )
    `
    )
    .eq('playa_id', playaId)
    .eq('tipo_plaza_id', tipoPlazaId)
    .eq('modalidad_ocupacion', modalidadOcupacion)
    .eq('tipo_vehiculo', tipoVehiculo)
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  return {
    data: transformTarifaWithTipoPlaza(
      data as unknown as RawTarifaWithTipoPlaza
    ),
    error: null
  }
}
