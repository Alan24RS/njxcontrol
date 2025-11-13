'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { translateDBError } from '@/utils/errorMessages'

import { syncPlayeroPlayas } from './syncPlayeroPlayas'

/**
 * Actualiza el estado del playero y sincroniza sus playas asignadas
 */
export async function updatePlayeroWithPlayas({
  playeroId,
  duenoId,
  nuevasPlayas,
  nuevoEstado,
  playas,
  nuevoNombre,
  nuevoTelefono
}: {
  playeroId: string
  duenoId?: string | null
  nuevasPlayas?: string[]
  nuevoEstado?: string
  playas?: { playa_id: string; estado?: string | null }[]
  nuevoNombre?: string | null
  nuevoTelefono?: string | null
}) {
  const supabase = await createClient()

  // Defensive: if duenoId wasn't provided (e.g. client tried to pass it),
  // resolve the authenticated user server-side to determine ownership context.
  let resolvedDuenoId = duenoId
  if (!resolvedDuenoId) {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: 'No autorizado' }
    }
    resolvedDuenoId = user.id
  }

  // 1️⃣ Actualizar estado del playero
  // 1️⃣ Actualizar estado del playero
  // Nota: `playeros_con_estado_consolidado` es una vista que combina registros
  // y no es actualizable directamente (contiene UNION/aggregaciones). En vez
  // de intentar actualizar la vista, la lógica de estado se deriva de las
  // relaciones en `playero_playa` y de las invitaciones; por tanto, el cambio
  // de estado se aplicará indirectamente cuando sincronicemos las playas
  // (syncPlayeroPlayas) o cuando actualicemos las filas subyacentes.
  // Si en el futuro necesitamos forzar un campo persistente de estado, deberíamos
  // actualizar la tabla subyacente correspondiente (no la vista).

  // 1.5️⃣ Actualizar nombre / telefono si vienen
  // El view `playeros_con_estado_consolidado` no es actualizable directamente.
  // Actualizamos la tabla `usuario` (tabla subyacente) para reflejar nombre/telefono.
  if (
    typeof nuevoNombre !== 'undefined' ||
    typeof nuevoTelefono !== 'undefined'
  ) {
    const payload: Record<string, unknown> = {}
    if (typeof nuevoNombre !== 'undefined') payload.nombre = nuevoNombre
    if (typeof nuevoTelefono !== 'undefined') payload.telefono = nuevoTelefono

    if (Object.keys(payload).length > 0) {
      const { error: infoError } = await supabase
        .from('usuario')
        .update(payload)
        .eq('usuario_id', playeroId)

      if (infoError) {
        console.error(
          'Error actualizando info del playero en usuario:',
          infoError
        )
        return { error: translateDBError(infoError.message) }
      }
    }
  }

  // 2️⃣ Sincronizar playas si corresponde
  // Ejecutar la sincronización cuando el cliente explícitamente envía el campo
  // (incluso si es un arreglo vacío) para permitir quitar todas las playas.
  if (typeof nuevasPlayas !== 'undefined' || typeof playas !== 'undefined') {
    // Prefer a per-playa estados if provided; otherwise fall back to nuevoEstado
    const { error } = await syncPlayeroPlayas(
      playeroId,
      resolvedDuenoId,
      nuevasPlayas ?? [],
      nuevoEstado,
      playas ?? []
    )
    if (error) return { error }
  }

  return { success: true }
}
