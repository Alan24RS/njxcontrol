import type { Caracteristica, RawCaracteristica } from './types'

export function transformListCaracteristica(
  raw: RawCaracteristica[] | null | undefined
): Caracteristica[] {
  if (!raw) return []

  return raw.map((item) => ({
    id: item.caracteristica_id,
    nombre: item.nombre,
    fechaCreacion: new Date(item.fecha_creacion),
    fechaModificacion: new Date(item.fecha_modificacion)
  }))
}

export function transformCaracteristica(
  raw: RawCaracteristica | null | undefined
): Caracteristica | null {
  if (!raw) return null

  return {
    id: raw.caracteristica_id,
    nombre: raw.nombre,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}
