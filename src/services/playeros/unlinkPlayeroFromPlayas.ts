'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

type UnlinkResult = {
  playasDesvinculadas: number
  relacionesRestantes: number
  rolEliminado: boolean
  message: string
}

export async function unlinkPlayeroFromPlayas(
  playeroId: string,
  playasIds: string[],
  motivo?: string
): Promise<ApiResponse<UnlinkResult>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) return { data: null, error: 'No autorizado' }

  try {
    // 1) validar que las playas pertenezcan al dueño
    const { data: validPlayas, error: playasError } = await supabase
      .from('playa')
      .select('playa_id')
      .in('playa_id', playasIds)
      .eq('playa_dueno_id', user.id)

    if (playasError) {
      console.error('Error comprobando playas del dueño:', playasError)
      return { data: null, error: translateDBError(playasError.message) }
    }

    const v_playas_validas = (validPlayas || []).map((p: any) => p.playa_id)
    if (!v_playas_validas || v_playas_validas.length === 0) {
      return { data: null, error: 'No tienes permisos sobre estas playas' }
    }

    // 2) identificar relaciones activas que vamos a marcar como baja
    const { data: activeRelations, error: selectErr } = await supabase
      .from('playero_playa')
      .select('playa_id')
      .eq('playero_id', playeroId)
      .in('playa_id', v_playas_validas)
      .is('fecha_baja', null)

    if (selectErr) {
      console.error('Error comprobando relaciones playero_playa:', selectErr)
      return { data: null, error: translateDBError(selectErr.message) }
    }

    const playasToUnlink = (activeRelations || []).map((r: any) => r.playa_id)

    // 3) soft-delete: setear fecha_baja y motivo_baja
    let playasDesvinculadas = 0
    if (playasToUnlink.length > 0) {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('playero_playa')
        .update({
          fecha_baja: new Date().toISOString(),
          motivo_baja: motivo || 'Desvinculado por el dueño'
        })
        .in('playa_id', playasToUnlink)
        .eq('playero_id', playeroId)
        .is('fecha_baja', null)
        .select('playa_id')

      if (updateErr) {
        console.error(
          'Error aplicando soft-delete en playero_playa:',
          updateErr
        )
        return { data: null, error: translateDBError(updateErr.message) }
      }

      playasDesvinculadas = (updatedRows || []).length
    }

    // 4) contar relaciones restantes (ACTIVO o SUSPENDIDO) sin fecha_baja
    const { data: restantesRows, error: restantesErr } = await supabase
      .from('playero_playa')
      .select('playero_id')
      .eq('playero_id', playeroId)
      .in('estado', ['ACTIVO', 'SUSPENDIDO'])
      .is('fecha_baja', null)

    if (restantesErr) {
      console.error('Error contando relaciones restantes:', restantesErr)
      return { data: null, error: translateDBError(restantesErr.message) }
    }

    const relacionesRestantes = (restantesRows || []).length

    // 5) si no quedan relaciones, eliminar rol PLAYERO
    let rolEliminado = false
    if (relacionesRestantes === 0) {
      const { data: delRoleData, error: delRoleErr } = await supabase
        .from('rol_usuario')
        .delete()
        .eq('usuario_id', playeroId)
        .eq('rol', 'PLAYERO')

      if (delRoleErr) {
        console.error('Error eliminando rol PLAYERO:', delRoleErr)
        return { data: null, error: translateDBError(delRoleErr.message) }
      }

      rolEliminado = (delRoleData || []).length > 0
    }

    // 6) eliminar invitaciones pendientes relacionadas
    const { error: delInvErr } = await supabase
      .from('playero_invitacion')
      .delete()
      .eq('dueno_invitador_id', user.id)
      .eq('auth_user_id', playeroId)
      .in('estado', ['PENDIENTE', 'EXPIRADA'])

    if (delInvErr) {
      console.error('Error eliminando invitaciones pendientes:', delInvErr)
      return { data: null, error: translateDBError(delInvErr.message) }
    }

    return {
      data: {
        playasDesvinculadas,
        relacionesRestantes,
        rolEliminado,
        message: `Playero desvinculado de ${playasDesvinculadas} playa(s)`
      },
      error: null
    }
  } catch (error) {
    console.error('Error unlinking playero:', error)
    return { data: null, error: 'Error inesperado al desvincular playero' }
  }
}
