import { PLAYA_ESTADO, PlayaEstado } from '@/constants/playaEstado'
import type { PaginationParams } from '@/types/api'

export type GetPlayasParams = PaginationParams & {
  select?: string
  estado?: PlayaEstado | PlayaEstado[]
  ciudad?: string | string[]
}

export type GetPlayasPublicasParams = PaginationParams & {}

export type GetPlayasCercanasParams = {
  latitud: number
  longitud: number
  radio: number
}

export type RawPlaya = {
  playa_id: string
  playa_dueno_id: string
  nombre: string | null
  direccion: string
  horario: string
  descripcion: string
  latitud: number | null
  longitud: number | null
  ciudad_id: string
  ciudad_nombre?: string
  ciudad_provincia?: string
  estado: PLAYA_ESTADO
  fecha_creacion: string
  fecha_modificacion: string
  fecha_eliminacion: string
}

export type RawPlayaPublica = Pick<
  RawPlaya,
  | 'playa_id'
  | 'nombre'
  | 'direccion'
  | 'horario'
  | 'descripcion'
  | 'latitud'
  | 'longitud'
  | 'ciudad_id'
  | 'estado'
>

export type Playa = {
  id: string
  duenoId: string
  nombre: string | null
  direccion: string
  descripcion: string
  horario: string
  latitud: number | null
  longitud: number | null
  ciudadId: string
  ciudadNombre?: string
  ciudadProvincia?: string
  estado: PLAYA_ESTADO
  fechaCreacion: Date
  fechaModificacion: Date
  fechaEliminacion: Date
}

export type PlayaPublica = {
  id: string
  nombre: string | null
  direccion: string
  descripcion: string
  horario: string
  latitud: number | null
  longitud: number | null
  ciudadId: string
  estado: PLAYA_ESTADO
}

export type RawPlayaBasica = Pick<
  Playa,
  'id' | 'nombre' | 'direccion' | 'descripcion'
>

export type PlayaBasica = Pick<
  Playa,
  'id' | 'nombre' | 'direccion' | 'descripcion'
>

export type Ciudad = {
  id: string
  nombre: string
  provincia: string
  fechaCreacion: Date
  fechaModificacion: Date
}

export type RawCiudad = {
  ciudad_id: string
  nombre: string
  provincia: string
  fecha_creacion: string
  fecha_modificacion: string
}

// Tipos para disponibilidad de plazas por tipo
export type DisponibilidadTipoPlaza = {
  tipoPlazaId: number
  tipoPlazaNombre: string
  tipoPlazaDescripcion: string | null
  totalPlazas: number
  plazasDisponibles: number
}

export type RawDisponibilidadTipoPlaza = {
  tipo_plaza_id: number
  tipo_plaza_nombre: string
  tipo_plaza_descripcion: string | null
  total_plazas: number
  plazas_disponibles: number
}

export type PlayaConDisponibilidad = {
  id: string
  nombre: string | null
  direccion: string
  descripcion: string
  horario: string
  latitud: number | null
  longitud: number | null
  ciudadId: string
  ciudadNombre: string
  ciudadProvincia: string
  estado: PLAYA_ESTADO
  disponibilidadPorTipo: DisponibilidadTipoPlaza[]
  totalPlazas: number
  totalDisponibles: number
}

export type RawPlayaConDisponibilidad = {
  playa_id: string
  playa_nombre: string | null
  playa_direccion: string
  playa_descripcion: string
  playa_horario: string
  playa_latitud: number | null
  playa_longitud: number | null
  playa_estado: PLAYA_ESTADO
  ciudad_id: string
  ciudad_nombre: string
  ciudad_provincia: string
  tipo_plaza_id: number
  tipo_plaza_nombre: string
  tipo_plaza_descripcion: string | null
  total_plazas: number
  plazas_disponibles: number
}
