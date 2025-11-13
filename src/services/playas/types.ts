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
