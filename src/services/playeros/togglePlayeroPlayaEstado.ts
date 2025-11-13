'use server'

import { createClient } from '@/lib/supabase/server'
import { translateDBError } from '@/utils/errorMessages'

export async function togglePlayeroPlayaEstado(
  playeroId: string,
  playaId: string
) {
  const supabase = await createClient()

  try {
    console.debug(
      '[togglePlayeroPlayaEstado] playeroId, playaId:',
      playeroId,
      playaId
    )
    // Obtener la fila actual
    const { data: row, error: errRows } = await supabase
      .from('playero_playa')
      .select('estado, dueno_invitador_id')
      .eq('playero_id', playeroId)
      .eq('playa_id', playaId)
      .single()

    if (errRows) {
      // Si no hay fila encontrada, supabase devuelve error; manejarlo
      console.error(
        'Error/No row obtenida en playero_playa para toggle:',
        errRows
      )
      return { data: null, error: translateDBError(errRows.message) }
    }

    if (!row) {
      return { data: null, error: 'Relación playero-playa no encontrada' }
    }
    if (!row) {
      return { data: null, error: 'Relación playero-playa no encontrada' }
    }

    const nuevo = row.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO'

    // Only change the estado and fecha_modificacion when toggling.
    // Do NOT set fecha_baja here: suspension should not be a soft-delete.
    const payload: any = {
      estado: nuevo,
      fecha_modificacion: new Date().toISOString()
    }

    const { error: errUpdate } = await supabase
      .from('playero_playa')
      .update(payload)
      .eq('playero_id', playeroId)
      .eq('playa_id', playaId)

    if (errUpdate) {
      console.error('Error actualizando estado playero_playa:', errUpdate)
      return { data: null, error: translateDBError(errUpdate.message) }
    }

    return { data: { nuevoEstado: nuevo }, error: null }
  } catch (err: any) {
    console.error('Exception togglePlayeroPlayaEstado:', err)
    return { data: null, error: err?.message || 'Error' }
  }
}
