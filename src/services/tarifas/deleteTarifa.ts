'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { revalidateAdminPath } from '@/utils/revalidation'

export type DeleteTarifaParams = {
  playaId: string
  tipoPlazaId: number
  modalidadOcupacion: string
  tipoVehiculo: string
}

export async function deleteTarifa({
  playaId,
  tipoPlazaId,
  modalidadOcupacion,
  tipoVehiculo
}: DeleteTarifaParams): Promise<ApiResponse<boolean>> {
  const supabase = await createClient()

  try {
    // Llamar a la función RPC que maneja la lógica de eliminación
    const { data, error } = await supabase.rpc('delete_tarifa', {
      p_playa_id: playaId,
      p_tipo_plaza_id: tipoPlazaId,
      p_modalidad_ocupacion: modalidadOcupacion,
      p_tipo_vehiculo: tipoVehiculo
    })

    if (error) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    // Verificar el resultado de la función RPC
    if (!data?.success) {
      return {
        data: null,
        error: data?.error || 'Error al eliminar la tarifa'
      }
    }

    // Revalidar cache de tarifas y página de admin
    await revalidateAdminPath()

    return {
      data: true,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al eliminar la tarifa'
    }
  }
}
