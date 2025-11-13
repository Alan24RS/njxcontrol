'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/services/email/sendInvitationEmail'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function resendInvitation(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    const supabase = await createClient()

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'reenviar_invitacion_playero',
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
        error: rpcResult?.error || 'Error al reenviar invitación'
      }
    }

    try {
      await sendInvitationEmail({
        email: rpcResult.email,
        nombre: rpcResult.nombre,
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

      await supabase.rpc('eliminar_invitacion_pendiente', {
        p_email: email,
        p_dueno_id: user.id
      })

      return {
        data: null,
        error: 'Error al enviar email de invitación'
      }
    }

    return {
      data: { message: rpcResult.message },
      error: null
    }
  } catch (error) {
    console.error('Error resending invitation:', error)
    return { data: null, error: 'Error inesperado al reenviar invitación' }
  }
}
