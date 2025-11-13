'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export type DeleteTipoPlazaResponse = {
  success: boolean
  type: 'soft_delete' | 'hard_delete'
  message: string
}

export async function deleteTipoPlaza(
  tipoPlazaId: number,
  playaId: string
): Promise<ApiResponse<DeleteTipoPlazaResponse>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('delete_tipo_plaza', {
      p_tipo_plaza_id: tipoPlazaId,
      p_playa_id: playaId
    })

    if (error) {
      console.error('Error deleting tipo plaza:', error)
      return {
        data: null,
        error: error.message || 'Error al eliminar el tipo de plaza'
      }
    }

    if (!data.success) {
      return {
        data: null,
        error: data.error || 'Error al eliminar el tipo de plaza'
      }
    }

    return {
      data: {
        success: data.success,
        type: data.type,
        message: data.message
      },
      error: null
    }
  } catch (error) {
    console.error('Unexpected error deleting tipo plaza:', error)
    return {
      data: null,
      error: 'Error inesperado al eliminar el tipo de plaza'
    }
  }
}
