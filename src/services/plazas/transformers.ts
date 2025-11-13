import type {
  Plaza,
  RawPlaza,
  RawPlazaView,
  RawPlazaWithRelations
} from './types'

export function transformListPlaza(
  raw: RawPlazaWithRelations[] | null | undefined
): Plaza[] {
  if (!raw) return []

  return raw.map((plaza) => ({
    id: plaza.plaza_id,
    fechaCreacion: new Date(plaza.fecha_creacion),
    fechaModificacion: plaza.fecha_modificacion
      ? new Date(plaza.fecha_modificacion)
      : null,
    playaId: plaza.playa_id,
    tipoPlazaId: plaza.tipo_plaza_id,
    identificador: plaza.identificador,
    estado: plaza.estado,
    playa: plaza.playa
      ? {
          direccion: plaza.playa.direccion
        }
      : undefined,
    tipoPlaza: plaza.tipo_plaza
      ? {
          nombre: plaza.tipo_plaza.nombre
        }
      : undefined
  }))
}

export function transformPlaza(raw: RawPlaza | null | undefined): Plaza | null {
  if (!raw) return null

  return {
    id: raw.plaza_id,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: raw.fecha_modificacion
      ? new Date(raw.fecha_modificacion)
      : null,
    playaId: raw.playa_id,
    tipoPlazaId: raw.tipo_plaza_id,
    identificador: raw.identificador,
    estado: raw.estado
  }
}

export function transformListPlazaFromView(
  raw: RawPlazaView[] | null | undefined
): Plaza[] {
  if (!raw) return []

  return raw.map((plaza) => ({
    id: plaza.plaza_id,
    fechaCreacion: new Date(plaza.fecha_creacion),
    fechaModificacion: plaza.fecha_modificacion
      ? new Date(plaza.fecha_modificacion)
      : null,
    playaId: plaza.playa_id,
    tipoPlazaId: plaza.tipo_plaza_id,
    identificador: plaza.identificador,
    estado: plaza.plaza_estado,
    playa: {
      direccion: plaza.playa_direccion
    },
    tipoPlaza: {
      nombre: plaza.tipo_plaza_nombre
    }
  }))
}
