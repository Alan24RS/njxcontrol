'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

/**
 * Trae un playero con su información consolidada y sus playas asociadas (con estado y fechas)
 */
export async function getPlayeroWithDatePlayas(
  playeroId: string
): Promise<ApiResponse<any>> {
  const supabase = await createClient()

  // 1️⃣ Obtener info general del playero
  const { data: playero, error: errorPlayero } = await supabase
    .from('playeros_con_estado_consolidado')
    .select(
      'playero_id, dueno_invitador_id, nombre, email, telefono, estado, fecha_alta, fecha_creacion, fecha_modificacion'
    )
    .eq('playero_id', playeroId)
    .single()

  if (errorPlayero) {
    console.error('Error obteniendo playero:', errorPlayero)
    return { data: null, error: errorPlayero.message }
  }

  // 2️⃣ Obtener sus playas asociadas
  const { data: playa, error: errorPlaya } = await supabase
    .from('playero_playa')
    .select(
      `
      playa_id,
      estado,
      fecha_alta,
      fecha_baja,
      fecha_creacion,
      fecha_modificacion,
      playa ( nombre, direccion, horario )
    `
    )
    .eq('playero_id', playeroId)
    .is('fecha_baja', null)
    .order('fecha_alta', { ascending: false })

  if (errorPlaya) {
    console.error('Error obteniendo playa:', errorPlaya)
    return { data: null, error: errorPlaya.message }
  }

  // 3️⃣ Consolidar info
  const formatted = {
    ...playero,
    fecha_alta:
      (playero as any)?.fecha_alta ?? (playero as any)?.fecha_creacion ?? null,
    fecha_modificacion: (playero as any)?.fecha_modificacion ?? null,
    playas: (playa ?? []).map((p: any) => ({
      playa_id: p.playa_id,
      playa_nombre: Array.isArray(p.playa)
        ? (p.playa[0]?.nombre ?? '(sin nombre)')
        : (p.playa?.nombre ?? '(sin nombre)'),
      playa_direccion: Array.isArray(p.playa)
        ? (p.playa[0]?.direccion ?? '')
        : (p.playa?.direccion ?? ''),
      estado: p.estado,
      horario: Array.isArray(p.playa)
        ? (p.playa[0]?.horario ?? null)
        : (p.playa?.horario ?? null),

      fechaBaja: p.fecha_baja
    }))
  }

  return { data: formatted, error: null }
}
