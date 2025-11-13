'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { InvitarPlayeroRequest } from '@/schemas/playero'
import { sendInvitationEmail } from '@/services/email/sendInvitationEmail'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function invitePlayero(
  data: InvitarPlayeroRequest
): Promise<ApiResponse<{ message: string }>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    // Usar la función RPC para crear la invitación con validaciones
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'crear_invitacion_playero',
      {
        p_email: data.email,
        p_nombre: data.nombre,
        p_playas_ids: data.playasIds,
        p_dueno_id: user.id
      }
    )

    if (rpcError) {
      return { data: null, error: translateDBError(rpcError.message) }
    }

    if (!rpcResult?.success) {
      return {
        data: null,
        error: rpcResult?.error || 'Error al crear invitación'
      }
    }

    // Enviar email personalizado con token de invitación
    try {
      await sendInvitationEmail({
        email: data.email,
        nombre: rpcResult.nombre || data.nombre || 'Usuario',
        invitacionId: rpcResult.invitacion_id,
        duenoNombre:
          rpcResult.dueno_nombre ||
          (user as any).user_metadata?.name ||
          user.email ||
          '',
        duenoEmail: user.email || '',
        playasNombres: rpcResult.playas_nombres || [],
        isExistingUser: rpcResult.usuario_existe || false
      })
    } catch (emailError) {
      console.error('Error enviando email:', emailError)

      // Rollback: eliminar invitación si falla el email
      await supabase.rpc('eliminar_invitacion_playero', {
        p_email: data.email,
        p_dueno_id: user.id
      })

      return {
        data: null,
        error: 'Error al enviar email de invitación'
      }
    }

    return {
      data: {
        message: rpcResult.message || `Invitación enviada a ${data.email}`
      },
      error: null
    }
  } catch (error) {
    console.error('Error inviting playero:', error)
    return { data: null, error: 'Error inesperado al enviar invitación' }
  }
}
