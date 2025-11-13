import type { Abonado, Abono, RawAbonado, RawAbono } from './types'

export function transformAbonado(
  raw: RawAbonado | null | undefined
): Abonado | null {
  if (!raw) return null

  return {
    id: raw.abonado_id,
    nombre: raw.nombre,
    apellido: raw.apellido,
    email: raw.email,
    telefono: raw.telefono,
    dni: raw.dni,
    fechaAlta: new Date(raw.fecha_alta),
    estado: raw.estado
  }
}

export function transformListAbonado(
  raw: RawAbonado[] | null | undefined
): Abonado[] {
  if (!raw) return []

  return raw.map((item) => transformAbonado(item)).filter(Boolean) as Abonado[]
}

export function transformAbono(raw: RawAbono | null | undefined): Abono | null {
  if (!raw) return null

  return {
    playaId: raw.playa_id,
    plazaId: raw.plaza_id,
    fechaHoraInicio: new Date(raw.fecha_hora_inicio),
    fechaFin: raw.fecha_fin ? new Date(raw.fecha_fin) : null,
    abonadoId: raw.abonado_id
  }
}

export function transformListAbono(
  raw: RawAbono[] | null | undefined
): Abono[] {
  if (!raw) return []

  return raw.map((item) => transformAbono(item)).filter(Boolean) as Abono[]
}
