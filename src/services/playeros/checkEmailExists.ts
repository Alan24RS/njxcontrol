'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

type EmailCheckResult = {
  existe: boolean
  usuario_id: string | null
  nombre: string | null
}

export async function checkEmailExists(
  email: string
): Promise<ApiResponse<EmailCheckResult>> {
  const supabase = await createClient()

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'verificar_email_existe',
      {
        p_email: email
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    return {
      data: rpcResult as EmailCheckResult,
      error: null
    }
  } catch (error) {
    console.error('Error checking email:', error)
    return { data: null, error: 'Error inesperado al verificar email' }
  }
}
