import { PaginationParams } from '@/types/api'

export type RawCaracteristica = {
  caracteristica_id: number
  nombre: string
  fecha_creacion: string
  fecha_modificacion: string
}

export type Caracteristica = {
  id: number
  nombre: string
  fechaCreacion: Date
  fechaModificacion: Date
}

export type GetCaracteristicasParams = PaginationParams & {}
