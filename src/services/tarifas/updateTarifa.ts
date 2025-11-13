'use server'

import { createClient } from '@/lib/supabase/server'
import { UpdateTarifaRequest } from '@/schemas/tarifa'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTarifa } from './transformers'
import type { RawTarifa, Tarifa } from './types'

export async function updateTarifa(
  playaId: string,
  tipoPlazaId: number,
  modalidadOcupacion: string,
  tipoVehiculo: string,
  data: UpdateTarifaRequest
): Promise<ApiResponse<Omit<Tarifa, 'tipoPlaza'>>> {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('tarifa')
    .update({
      precio_base: data.precioBase
    })
    .eq('playa_id', playaId)
    .eq('tipo_plaza_id', tipoPlazaId)
    .eq('modalidad_ocupacion', modalidadOcupacion)
    .eq('tipo_vehiculo', tipoVehiculo)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  return {
    data: transformTarifa(result as RawTarifa),
    error: null
  }
}
