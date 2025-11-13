'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function deletePendingInvitation(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'eliminar_invitacion_pendiente',
      {
        p_email: email,
        p_dueno_id: user.id
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al eliminar invitación'
      }
    }

    return {
      data: {
        message: rpcResult.message
      },
      error: null
    }
  } catch (error) {
    console.error('Error deleting pending invitation:', error)
    return { data: null, error: 'Error inesperado al eliminar invitación' }
  }
}
