import type { PaginationParams } from '@/types/api'

export interface RawTarifa {
  playa_id: string
  tipo_plaza_id: number
  modalidad_ocupacion: string
  tipo_vehiculo: string
  precio_base: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface RawTarifaWithTipoPlaza extends RawTarifa {
  tipo_plaza: {
    nombre: string
    descripcion: string | null
  }
}

export interface RawTarifaView {
  playa_id: string
  tipo_plaza_id: number
  modalidad_ocupacion: string
  tipo_vehiculo: string
  precio_base: number
  fecha_creacion: string
  fecha_modificacion: string
  tipo_plaza_nombre: string
  tipo_plaza_descripcion: string | null
  modalidad_ocupacion_order: number
  tipo_vehiculo_order: number
}

export interface Tarifa {
  playaId: string
  tipoPlazaId: number
  modalidadOcupacion: string
  tipoVehiculo: string
  precioBase: number
  fechaCreacion: Date
  fechaModificacion: Date
  tipoPlaza: {
    nombre: string
    descripcion: string | null
  }
}

export interface GetTarifasParams extends PaginationParams {
  playaId: string
  tipoPlaza?: number
  modalidadOcupacion?: string
  tipoVehiculo?: string
}
