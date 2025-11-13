'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function deletePlayero(
  playeroId: string,
  playaId: string,
  motivo?: string
): Promise<ApiResponse<{ message: string; action: 'deleted' | 'suspended' }>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    // Usar la función RPC para eliminar el playero con validaciones
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'eliminar_playero',
      {
        p_playero_id: playeroId,
        p_playa_id: playaId,
        p_motivo: motivo || 'Eliminado por el dueño'
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al eliminar playero'
      }
    }

    return {
      data: {
        message: rpcResult.message,
        action: rpcResult.action
      },
      error: null
    }
  } catch (error) {
    console.error('Error deleting playero:', error)
    return { data: null, error: 'Error inesperado al eliminar playero' }
  }
}
