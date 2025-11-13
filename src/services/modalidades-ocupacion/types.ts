import {
  EstadoModalidadOcupacion,
  ModalidadOcupacion
} from '@/constants/modalidadOcupacion'
import type { PaginationParams } from '@/types/api'

export type GetModalidadesOcupacionParams = PaginationParams & {
  playaId?: string
}

export type RawModalidadOcupacionPlaya = {
  playa_id: string
  modalidad_ocupacion: ModalidadOcupacion
  estado: EstadoModalidadOcupacion
  fecha_creacion: string
  fecha_modificacion: string
}

export type ModalidadOcupacionPlaya = {
  playaId: string
  modalidadOcupacion: ModalidadOcupacion
  estado: EstadoModalidadOcupacion
  fechaCreacion: Date
  fechaModificacion: Date
}
