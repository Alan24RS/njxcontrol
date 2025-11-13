'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformVehiculo } from './transformers'
import type { RawVehiculo, Vehiculo } from './types'

export async function getVehiculo(
  patente: string
): Promise<ApiResponse<Vehiculo>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehiculo')
    .select('patente, tipo_vehiculo')
    .eq('patente', patente.toUpperCase().trim())
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  if (!data) {
    return {
      data: null,
      error: 'Vehículo no encontrado'
    }
  }

  const vehiculo = transformVehiculo(data as unknown as RawVehiculo)

  return {
    data: vehiculo,
    error: null
  }
}
