'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function acceptInvitationWithoutAuth(
  token: string,
  email: string
): Promise<ApiResponse<{ message: string; playasAsignadas: number }>> {
  const supabase = await createClient()

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'aceptar_invitacion_sin_auth',
      {
        p_token: token,
        p_email: email
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al aceptar invitación'
      }
    }

    return {
      data: {
        message: rpcResult.message,
        playasAsignadas: rpcResult.playas_asignadas
      },
      error: null
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { data: null, error: 'Error inesperado al aceptar invitación' }
  }
}
