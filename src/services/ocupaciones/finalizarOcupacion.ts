import { getAuthenticatedUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import type { FinalizeOcupacionData } from '@/schemas/ocupacion'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

// Provisional, reemplazar con el tipo generado por Supabase
type FinalizarOcupacionResult = {
  ok: boolean
  error?: string
  pagoId?: string
  numeroPago?: number
  monto?: number
  horaEgreso?: string
  montoSugerido?: number
}

export async function finalizarOcupacion(
  data: FinalizeOcupacionData
): Promise<ApiResponse<FinalizarOcupacionResult>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { error: 'Usuario no autenticado', data: null }
  }

  const { ocupacionId, metodoPago, monto, observaciones } = data

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'finalizar_ocupacion',
    {
      p_ocupacion_id: ocupacionId,
      p_metodo_pago: metodoPago,
      p_monto_manual: monto,
      p_playero_id: user.id,
      p_observaciones: observaciones ?? null
    }
  )

  if (rpcError) {
    console.error('Error calling RPC', rpcError)
    return { error: translateDBError(rpcError.message), data: null }
  }

  const result = rpcData as FinalizarOcupacionResult

  if (!result.ok) {
    console.error('RPC returned error', result)
    return { error: result.error ?? 'Error desconocido', data: null }
  }

  return { data: result, error: null }
}
