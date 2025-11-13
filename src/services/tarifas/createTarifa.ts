'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { CreateTarifaRequest } from '@/schemas/tarifa'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTarifa } from './transformers'
import type { RawTarifa, Tarifa } from './types'

export async function createTarifa(
  data: CreateTarifaRequest
): Promise<ApiResponse<Omit<Tarifa, 'tipoPlaza'>>> {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('tarifa')
    .insert({
      playa_id: data.playaId,
      tipo_plaza_id: data.tipoPlazaId,
      modalidad_ocupacion: data.modalidadOcupacion,
      tipo_vehiculo: data.tipoVehiculo,
      precio_base: data.precioBase
    })
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/tarifas')

  return {
    data: transformTarifa(result as RawTarifa),
    error: null
  }
}
