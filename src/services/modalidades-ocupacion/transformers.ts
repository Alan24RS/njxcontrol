import type {
  ModalidadOcupacionPlaya,
  RawModalidadOcupacionPlaya
} from './types'

export function transformModalidadOcupacion(
  raw: RawModalidadOcupacionPlaya
): ModalidadOcupacionPlaya {
  return {
    playaId: raw.playa_id,
    modalidadOcupacion: raw.modalidad_ocupacion,
    estado: raw.estado,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}

export function transformListModalidadOcupacion(
  rawList: RawModalidadOcupacionPlaya[] | null
): ModalidadOcupacionPlaya[] {
  if (!rawList) return []
  return rawList.map(transformModalidadOcupacion)
}
