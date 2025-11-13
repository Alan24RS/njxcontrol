import type { PaginationParams } from '@/types/api'

export type EstadoOperativoPlaza =
  | 'Disponible'
  | 'Ocupada'
  | 'Fuera de servicio'

export type PlazaConEstado = {
  plaza_id: string
  identificador: string | null
  tipo_plaza_nombre: string
  estado_operativo: EstadoOperativoPlaza
}

export type GetPlazasParams = PaginationParams & {
  playaId?: string
  tipoPlaza?: number
  select?: string
  estado?: 'ACTIVO' | 'SUSPENDIDO'
  onlyAvailable?: boolean
}

export type RawPlaza = {
  plaza_id: string
  fecha_creacion: string
  fecha_modificacion: string | null
  playa_id: string
  tipo_plaza_id: number
  identificador: string | null
  estado: 'ACTIVO' | 'SUSPENDIDO'
}

export type RawPlazaWithRelations = RawPlaza & {
  playa?: {
    playa_id?: string
    nombre?: string
    direccion: string
    ciudad?: {
      nombre: string
      provincia: string
    }
  }
  tipo_plaza?: {
    tipo_plaza_id?: number
    nombre: string
    descripcion?: string
  }
}

export type RawPlazaView = {
  plaza_id: string
  identificador: string | null
  plaza_estado: 'ACTIVO' | 'SUSPENDIDO'
  fecha_creacion: string
  fecha_modificacion: string | null
  fecha_eliminacion: string | null
  playa_id: string
  tipo_plaza_id: number
  playa_direccion: string
  playa_nombre: string | null
  playa_estado: 'BORRADOR' | 'ACTIVO' | 'SUSPENDIDO'
  tipo_plaza_nombre: string
  tipo_plaza_descripcion: string | null
}

export type Plaza = {
  id: string
  fechaCreacion: Date
  fechaModificacion: Date | null
  playaId: string
  tipoPlazaId: number
  identificador: string | null
  estado: 'ACTIVO' | 'SUSPENDIDO'
  playa?: {
    id?: string
    nombre?: string
    direccion: string
    ciudad?: {
      nombre: string
      provincia: string
    }
  }
  tipoPlaza?: {
    id?: number
    nombre: string
    descripcion?: string
  }
}
