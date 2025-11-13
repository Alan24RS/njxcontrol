'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export interface SelfAssignResult {
  message: string
  playasAsignadas: number
  totalPlayasSolicitadas: number
  rolAsignado: boolean
}

export async function selfAssignAsPlayero(
  playasIds: string[]
): Promise<ApiResponse<SelfAssignResult>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  if (!playasIds || playasIds.length === 0) {
    return { data: null, error: 'Debe seleccionar al menos una playa' }
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'auto_asignar_dueno_como_playero',
      {
        p_playas_ids: playasIds,
        p_dueno_id: user.id
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al auto-asignarse como playero'
      }
    }

    return {
      data: {
        message: rpcResult.message,
        playasAsignadas: rpcResult.playas_asignadas,
        totalPlayasSolicitadas: rpcResult.total_playas_solicitadas,
        rolAsignado: rpcResult.rol_asignado
      },
      error: null
    }
  } catch (error) {
    console.error('Error self-assigning as playero:', error)
    return { data: null, error: 'Error inesperado' }
  }
}
