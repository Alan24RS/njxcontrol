import type { MetodoPagoPlaya, RawMetodoPagoPlaya } from './types'

export const transformMetodoPagoPlaya = (
  raw: RawMetodoPagoPlaya
): MetodoPagoPlaya => ({
  playaId: raw.playa_id,
  metodoPago: raw.metodo_pago,
  estado: raw.estado,
  fechaCreacion: new Date(raw.fecha_creacion),
  fechaModificacion: new Date(raw.fecha_modificacion)
})

export const transformListMetodoPagoPlaya = (
  rawList: RawMetodoPagoPlaya[] | null
): MetodoPagoPlaya[] => {
  if (!rawList) return []
  return rawList.map(transformMetodoPagoPlaya)
}
