import { createClient } from '@/lib/supabase/server'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Sincroniza la tabla playero_playa para reflejar las playas seleccionadas
 * @param playeroId uuid del playero (usuario)
 * @param duenoInvitadorId uuid del dueño (opcional, para nuevas relaciones)
 * @param nuevasPlayas array de ids de playas seleccionadas
 */
export async function syncPlayeroPlayas(
  playeroId: string,
  duenoInvitadorId: string,
  nuevasPlayas?: string[],
  desiredEstado?: string | null,
  playas?: { playa_id: string; estado?: string | null }[]
) {
  const supabase = await createClient()

  // 1. Obtener las playas actualmente asignadas
  const { data: actuales, error: errorActuales } = await supabase
    .from('playero_playa')
    .select('playa_id')
    .eq('playero_id', playeroId)
    .is('fecha_baja', null)

  if (errorActuales) {
    console.error('Error obteniendo playero_playa actuales:', errorActuales)
    const translated = translateDBError(errorActuales.message)
    return {
      error:
        translated === errorActuales.message
          ? `${translated}`
          : `${translated} (${errorActuales.message})`
    }
  }

  const actualesIds = (actuales || []).map((p: any) => p.playa_id)

  // Normalizar ids a string y eliminar posibles espacios para evitar mismatches
  const actualesIdsStr = actualesIds.map((id: any) => String(id).trim())
  const nuevasPlayasStr = (nuevasPlayas || []).map((id: any) =>
    String(id).trim()
  )

  // Build a map of desired estados per playa if provided
  const desiredEstadoMap = new Map<string, string | null>()
  if (playas && Array.isArray(playas)) {
    for (const p of playas) {
      if (p && p.playa_id) {
        desiredEstadoMap.set(String(p.playa_id).trim(), p.estado ?? null)
      }
    }
  }

  // 2. Calcular a eliminar y a agregar
  const aEliminar = actualesIdsStr.filter(
    (id: string) => !nuevasPlayasStr.includes(id)
  )
  const aAgregar = nuevasPlayasStr.filter(
    (id: string) => !actualesIdsStr.includes(id)
  )

  // 3. Eliminar relaciones (soft delete: set fecha_baja)
  if (aEliminar.length > 0) {
    const { error: errorDelete } = await supabase
      .from('playero_playa')
      .update({
        fecha_baja: new Date().toISOString(),
        motivo_baja: 'Desasignado por edición'
      })
      .in('playa_id', aEliminar)
      .eq('playero_id', playeroId)
      .is('fecha_baja', null)
    if (errorDelete) {
      console.error('Error eliminando playero_playa:', errorDelete)
      const translated = translateDBError(errorDelete.message)
      return {
        error:
          translated === errorDelete.message
            ? `${translated}`
            : `${translated} (${errorDelete.message})`
      }
    }
  }

  // 4. Insertar nuevas relaciones
  for (const playaId of aAgregar) {
    // Comprobar si ya existe una fila (incluso soft-deleted). Si existe y está dada de baja,
    // la reactivamos en lugar de insertar para evitar violación de PK.
    const { data: existingRows, error: errorExisting } = await supabase
      .from('playero_playa')
      .select('*')
      .eq('playero_id', playeroId)
      .eq('playa_id', playaId)
      .limit(1)

    if (errorExisting) {
      console.error(
        'Error comprobando existencia en playero_playa:',
        errorExisting
      )
      const translated = translateDBError(errorExisting.message)
      return {
        error:
          translated === errorExisting.message
            ? `${translated}`
            : `${translated} (${errorExisting.message})`
      }
    }

    const existing = (existingRows || [])[0]
    if (existing) {
      // Si existe y tiene fecha_baja, reactivar
      if (existing.fecha_baja) {
        // Verificar que el usuario tenga rol PLAYERO; si no, retornar error - no lo creamos automáticamente
        try {
          const { data: roleRows, error: roleErr } = await supabase
            .from('rol_usuario')
            .select('rol')
            .eq('usuario_id', playeroId)
            .eq('rol', 'PLAYERO')
            .limit(1)

          if (roleErr) {
            console.error('Error comprobando rol PLAYERO:', roleErr)
            const translated = translateDBError(roleErr.message)
            return {
              error:
                translated === roleErr.message
                  ? `${translated}`
                  : `${translated} (${roleErr.message})`
            }
          }

          if (!roleRows || roleRows.length === 0) {
            return {
              error: `El usuario ${playeroId} no tiene asignado el rol PLAYERO. Asigna el rol antes de crear la relación.`
            }
          }
        } catch (err) {
          console.error('Exception comprobando rol PLAYERO:', err)
          return { error: 'Error comprobando rol PLAYERO' }
        }
        // Si se proporciona un estado deseado (p. ej. 'SUSPENDIDO'), usarlo al reactivar;
        // de lo contrario, mantener comportamiento previo y marcar como ACTIVO.
        // Prefer per-playa estado if provided, otherwise desiredEstado, else ACTIVO
        const newEstado = desiredEstadoMap.has(String(playaId))
          ? (desiredEstadoMap.get(String(playaId)) ?? 'ACTIVO')
          : (desiredEstado ?? 'ACTIVO')
        const { error: errorReactivate } = await supabase
          .from('playero_playa')
          .update({
            fecha_baja: null,
            motivo_baja: null,
            estado: newEstado,
            fecha_modificacion: new Date().toISOString()
          })
          .eq('playero_id', playeroId)
          .eq('playa_id', playaId)

        if (errorReactivate) {
          console.error('Error reactivando playero_playa:', errorReactivate)
          const translated = translateDBError(errorReactivate.message)
          return {
            error:
              translated === errorReactivate.message
                ? `${translated}`
                : `${translated} (${errorReactivate.message})`
          }
        }
      } else {
        // Ya está activo; no hacemos nada
        continue
      }
    } else {
      // No existe: insertar nuevo registro
      // Insertar nuevo registro (asumimos que el usuario ya tiene rol PLAYERO)
      // Verificar que el usuario tenga rol PLAYERO antes de insertar la relación
      try {
        const { data: roleRows, error: roleErr } = await supabase
          .from('rol_usuario')
          .select('rol')
          .eq('usuario_id', playeroId)
          .eq('rol', 'PLAYERO')
          .limit(1)

        if (roleErr) {
          console.error(
            'Error comprobando rol PLAYERO antes de insert:',
            roleErr
          )
          const translated = translateDBError(roleErr.message)
          return {
            error:
              translated === roleErr.message
                ? `${translated}`
                : `${translated} (${roleErr.message})`
          }
        }

        if (!roleRows || roleRows.length === 0) {
          return {
            error: `El usuario ${playeroId} no tiene asignado el rol PLAYERO. Asigna el rol antes de crear la relación.`
          }
        }
      } catch (err) {
        console.error('Exception comprobando rol PLAYERO antes de insert:', err)
        return { error: 'Error comprobando rol PLAYERO' }
      }
      // Determine estado for new insertion: prefer per-playa, then desiredEstado, then ACTIVO
      const insertEstado = desiredEstadoMap.has(String(playaId))
        ? (desiredEstadoMap.get(String(playaId)) ?? 'ACTIVO')
        : (desiredEstado ?? 'ACTIVO')

      const { error: errorInsert } = await supabase
        .from('playero_playa')
        .insert({
          playero_id: playeroId,
          playa_id: playaId,
          dueno_invitador_id: duenoInvitadorId,
          estado: insertEstado,
          fecha_alta: new Date().toISOString(),
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString()
        })
      if (errorInsert) {
        console.error('Error insertando playero_playa:', errorInsert)
        const translated = translateDBError(errorInsert.message)
        return {
          error:
            translated === errorInsert.message
              ? `${translated}`
              : `${translated} (${errorInsert.message})`
        }
      }
    }
  }

  // 5. For existing active relations not added/removed, ensure estado matches desiredEstadoMap (if provided)
  if (desiredEstadoMap.size > 0) {
    // Fetch current active relations
    const { data: activeRows, error: errActive } = await supabase
      .from('playero_playa')
      .select('playa_id, estado')
      .eq('playero_id', playeroId)
      .is('fecha_baja', null)

    if (errActive) {
      console.error(
        'Error fetching active playero_playa for estado sync:',
        errActive
      )
    } else if (activeRows && activeRows.length > 0) {
      for (const row of activeRows) {
        const pid = String(row.playa_id)
        if (desiredEstadoMap.has(pid)) {
          const desired = desiredEstadoMap.get(pid)
          if (desired != null && row.estado !== desired) {
            const { error: errUpd } = await supabase
              .from('playero_playa')
              .update({
                estado: desired,
                fecha_modificacion: new Date().toISOString()
              })
              .eq('playero_id', playeroId)
              .eq('playa_id', pid)

            if (errUpd) {
              console.error(
                'Error actualizando estado existente en playero_playa:',
                errUpd
              )
            }
          }
        }
      }
    }
  }

  return { error: null }
}
