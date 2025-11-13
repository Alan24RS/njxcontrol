'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function rejectInvitation(
  token: string
): Promise<ApiResponse<{ message: string }>> {
  const supabase = await createClient()

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'rechazar_invitacion_playero',
      {
        p_token: token
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al rechazar invitación'
      }
    }

    return {
      data: { message: rpcResult.message },
      error: null
    }
  } catch (error) {
    console.error('Error rejecting invitation:', error)
    return { data: null, error: 'Error inesperado al rechazar invitación' }
  }
}
