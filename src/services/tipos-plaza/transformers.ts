import { transformCaracteristica } from '@/services/caracteristicas/transformers'

import type {
  RawTipoPlaza,
  RawTipoPlazaWithCaracteristicas,
  TipoPlaza
} from './types'

export function transformListTipoPlaza(
  raw: RawTipoPlazaWithCaracteristicas[] | null | undefined
): TipoPlaza[] {
  if (!raw) return []

  return raw.map((tipoPlaza) => ({
    id: tipoPlaza.tipo_plaza_id,
    playaId: tipoPlaza.playa_id,
    nombre: tipoPlaza.nombre,
    descripcion: tipoPlaza.descripcion,
    fechaCreacion: new Date(tipoPlaza.fecha_creacion),
    fechaModificacion: new Date(tipoPlaza.fecha_modificacion),
    fechaEliminacion: tipoPlaza.fecha_eliminacion
      ? new Date(tipoPlaza.fecha_eliminacion)
      : null,
    caracteristicas:
      tipoPlaza.tipo_plaza_caracteristica
        ?.map((tpc) => transformCaracteristica(tpc.caracteristica))
        .filter((c) => c !== null) ?? []
  }))
}

export function transformTipoPlaza(
  raw:
    | (RawTipoPlaza & Partial<RawTipoPlazaWithCaracteristicas>)
    | null
    | undefined
): TipoPlaza | null {
  if (!raw) return null

  return {
    id: raw.tipo_plaza_id,
    playaId: raw.playa_id,
    nombre: raw.nombre,
    descripcion: raw.descripcion,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion),
    fechaEliminacion: raw.fecha_eliminacion
      ? new Date(raw.fecha_eliminacion)
      : null,
    caracteristicas:
      raw.tipo_plaza_caracteristica
        ?.map((tpc) => transformCaracteristica(tpc.caracteristica))
        .filter((c) => c !== null) ?? []
  }
}
