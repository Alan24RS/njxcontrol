'use server'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export async function toggleSelfPlayeroRole(
  playaId: string,
  currentlyIsPlayero: boolean
): Promise<ApiResponse<{ message: string }>> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user || !user.roles.includes(ROL.DUENO)) {
    return { data: null, error: 'No autorizado' }
  }

  try {
    // Verificar que la playa le pertenece
    const { data: playa } = await supabase
      .from('playa')
      .select('playa_dueno_id')
      .eq('playa_id', playaId)
      .single()

    if (!playa || playa.playa_dueno_id !== user.id) {
      return { data: null, error: 'No tienes permisos sobre esta playa' }
    }

    if (currentlyIsPlayero) {
      // Remover asignación como playero
      const { error } = await supabase
        .from('playero_playa')
        .delete()
        .eq('playero_id', user.id)
        .eq('playa_id', playaId)
        .eq('dueno_invitador_id', user.id)

      if (error) {
        return { data: null, error: translateDBError(error.message) }
      }

      return {
        data: { message: 'Te has removido como playero de esta playa' },
        error: null
      }
    } else {
      // Asignar rol PLAYERO si no lo tiene
      await supabase
        .from('rol_usuario')
        .upsert({ usuario_id: user.id, rol: 'PLAYERO' })

      // Crear relación playero_playa
      const { error } = await supabase.from('playero_playa').insert({
        playero_id: user.id,
        playa_id: playaId,
        dueno_invitador_id: user.id, // Se asigna a sí mismo
        estado: 'ACTIVO'
      })

      if (error) {
        return { data: null, error: translateDBError(error.message) }
      }

      return {
        data: { message: 'Te has asignado como playero de esta playa' },
        error: null
      }
    }
  } catch (error) {
    console.error('Error toggling self playero role:', error)
    return { data: null, error: 'Error inesperado al cambiar asignación' }
  }
}
