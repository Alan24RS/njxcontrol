import { EstadoTipoVehiculo, TipoVehiculo } from '@/constants/tipoVehiculo'
import type { PaginationParams } from '@/types/api'

export type GetTiposVehiculoParams = PaginationParams & {
  playaId?: string
  estado?: EstadoTipoVehiculo
}

export type RawTipoVehiculoPlaya = {
  playa_id: string
  tipo_vehiculo: TipoVehiculo
  estado: EstadoTipoVehiculo
  fecha_creacion: string
  fecha_modificacion: string
}

export type TipoVehiculoPlaya = {
  playaId: string
  tipoVehiculo: TipoVehiculo
  estado: EstadoTipoVehiculo
  fechaCreacion: Date
  fechaModificacion: Date
}
