import type { RawTipoVehiculoPlaya, TipoVehiculoPlaya } from './types'

export function transformTipoVehiculoPlaya(
  raw: RawTipoVehiculoPlaya
): TipoVehiculoPlaya {
  return {
    playaId: raw.playa_id,
    tipoVehiculo: raw.tipo_vehiculo,
    estado: raw.estado,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}

export function transformListTipoVehiculoPlaya(
  raw: RawTipoVehiculoPlaya[] | null
): TipoVehiculoPlaya[] {
  if (!raw) return []
  return raw.map(transformTipoVehiculoPlaya)
}
