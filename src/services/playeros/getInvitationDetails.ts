'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type InvitationDetails = {
  invitacion_id: string
  email: string
  nombre_asignado: string
  dueno_nombre: string
  fecha_invitacion: string
  fecha_expiracion: string
  playas: Array<{
    playa_id: string
    nombre: string
    direccion: string
    descripcion?: string
  }>
}

export async function getInvitationDetails(
  email: string,
  duenoId: string
): Promise<ApiResponse<InvitationDetails>> {
  const supabase = await createClient()

  try {
    // Usar la función RPC para obtener detalles de la invitación
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'obtener_detalles_invitacion',
      {
        p_email: email,
        p_dueno_id: duenoId
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Invitación no encontrada'
      }
    }

    return {
      data: rpcResult.invitacion,
      error: null
    }
  } catch (error) {
    console.error('Error getting invitation details:', error)
    return {
      data: null,
      error: 'Error inesperado al obtener detalles de invitación'
    }
  }
}
