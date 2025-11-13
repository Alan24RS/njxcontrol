import type { PLAYERO_PLAYA_ESTADO } from '@/constants/playeroEstado'
import type { PaginationParams } from '@/types/api'

export type RawPlayeroPlaya = {
  playero_id: string | null
  dueno_invitador_id: string
  estado: PLAYERO_PLAYA_ESTADO
  fecha_alta: string | null
  fecha_baja: string | null
  motivo_baja: string | null
  fecha_creacion: string
  fecha_modificacion: string
  usuario_id: string | null
  email: string
  usuario_nombre: string
  usuario_telefono: string | null
  tipo_registro: 'REGISTRADO' | 'INVITACION_PENDIENTE'
  playas_asignadas: PlayaAsignada[]
  total_playas: number
}

export type Playero = {
  id: string
  email: string
  nombre: string
  telefono: string | null
  estado: PLAYERO_PLAYA_ESTADO
  fechaAlta: Date
  fechaBaja: Date | null
  motivoBaja: string | null
  fechaCreacion: Date
  fechaModificacion: Date
  playas: PlayaAsignada[]
}

export type PlayaAsignada = {
  playa_id: string
  nombre: string | null
  direccion: string | null
  estado: PLAYERO_PLAYA_ESTADO
  fecha_alta: string | null
  fecha_baja: string | null
}

export type GetPlayerosParams = PaginationParams & {
  playaId?: string // Ahora es opcional
}

export type PlayeroPlaya = {
  playeroId: string | null
  duenoInvitadorId: string
  estado: PLAYERO_PLAYA_ESTADO
  fechaAlta: Date | null
  fechaBaja: Date | null
  motivoBaja: string | null
  tipoRegistro: 'REGISTRADO' | 'INVITACION_PENDIENTE'
  playasAsignadas: PlayaAsignada[]
  totalPlayas: number
  usuario: {
    id: string | null
    email: string
    nombre: string
    telefono: string | null
  }
}
