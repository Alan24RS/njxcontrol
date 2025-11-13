'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { revalidateAdminPath } from '@/utils/revalidation'

export async function deletePlaza(id: string): Promise<ApiResponse<boolean>> {
  const supabase = await createClient()

  try {
    // Llamar a la función RPC que maneja la lógica de eliminación
    const { data, error } = await supabase.rpc('delete_plaza', {
      plaza_id_param: id
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
        error: data?.error || 'Error al eliminar la plaza'
      }
    }

    // Revalidar cache de plazas y página de admin
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
          : 'Error desconocido al eliminar la plaza'
    }
  }
}
