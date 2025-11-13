import type { RawVehiculo, Vehiculo } from './types'

export function transformVehiculo(raw: RawVehiculo): Vehiculo {
  return {
    patente: raw.patente,
    tipoVehiculo: raw.tipo_vehiculo
  }
}
