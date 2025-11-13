'use server'

import { createClient } from '@/lib/supabase/server'

import type { TarifasPorTipoPlazaResponse } from './types'

export async function getTarifasPorTipoPlaza(
  playaId: string,
  tipoPlazaId: number,
  tiposVehiculo: string[]
): Promise<{
  data: TarifasPorTipoPlazaResponse | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tarifa')
      .select('tipo_vehiculo, precio_base')
      .eq('playa_id', playaId)
      .eq('tipo_plaza_id', tipoPlazaId)
      .eq('modalidad_ocupacion', 'ABONO')
      .in('tipo_vehiculo', tiposVehiculo)

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data || data.length === 0) {
      return {
        data: {
          tarifas: [],
          tarifaMaxima: null
        },
        error: null
      }
    }

    const tarifas = data.map((t) => ({
      tipoVehiculo: t.tipo_vehiculo,
      precio: t.precio_base
    }))

    const tarifaMaxima = Math.max(...tarifas.map((t) => t.precio))

    return {
      data: {
        tarifas,
        tarifaMaxima
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Error al obtener tarifas por tipo de plaza'
    }
  }
}
