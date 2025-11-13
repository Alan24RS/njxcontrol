import type { PlayeroPlaya, RawPlayeroPlaya } from './types'

export function transformPlayeroPlaya(raw: RawPlayeroPlaya): PlayeroPlaya {
  return {
    playeroId: raw.playero_id,
    duenoInvitadorId: raw.dueno_invitador_id,
    estado: raw.estado,
    fechaAlta: raw.fecha_alta ? new Date(raw.fecha_alta) : null,
    fechaBaja: raw.fecha_baja ? new Date(raw.fecha_baja) : null,
    motivoBaja: raw.motivo_baja,
    tipoRegistro: raw.tipo_registro,
    playasAsignadas: raw.playas_asignadas || [],
    totalPlayas: raw.total_playas || 0,
    usuario: {
      id: raw.usuario_id,
      email: raw.email,
      nombre: raw.usuario_nombre,
      telefono: raw.usuario_telefono
    }
  }
}

export function transformListPlayeroPlaya(
  rawList: RawPlayeroPlaya[] | null
): PlayeroPlaya[] {
  if (!rawList) return []
  return rawList.map(transformPlayeroPlaya)
}
