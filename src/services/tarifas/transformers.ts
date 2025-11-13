import type {
  RawTarifa,
  RawTarifaView,
  RawTarifaWithTipoPlaza,
  Tarifa
} from './types'

export function transformTarifa(raw: RawTarifa): Omit<Tarifa, 'tipoPlaza'> {
  return {
    playaId: raw.playa_id,
    tipoPlazaId: raw.tipo_plaza_id,
    modalidadOcupacion: raw.modalidad_ocupacion,
    tipoVehiculo: raw.tipo_vehiculo,
    precioBase: raw.precio_base,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}

export function transformTarifaWithTipoPlaza(
  raw: RawTarifaWithTipoPlaza
): Tarifa {
  return {
    ...transformTarifa(raw),
    tipoPlaza: {
      nombre: raw.tipo_plaza.nombre,
      descripcion: raw.tipo_plaza.descripcion
    }
  }
}

export function transformTarifaFromView(raw: RawTarifaView): Tarifa {
  return {
    playaId: raw.playa_id,
    tipoPlazaId: raw.tipo_plaza_id,
    modalidadOcupacion: raw.modalidad_ocupacion,
    tipoVehiculo: raw.tipo_vehiculo,
    precioBase: raw.precio_base,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion),
    tipoPlaza: {
      nombre: raw.tipo_plaza_nombre,
      descripcion: raw.tipo_plaza_descripcion
    }
  }
}

export function transformListTarifas(
  rawTarifas: RawTarifaWithTipoPlaza[] | null
): Tarifa[] {
  if (!rawTarifas) return []
  return rawTarifas.map(transformTarifaWithTipoPlaza)
}

export function transformListTarifasFromView(
  rawTarifas: RawTarifaView[] | null
): Tarifa[] {
  if (!rawTarifas) return []
  return rawTarifas.map(transformTarifaFromView)
}
