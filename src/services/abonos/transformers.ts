import type {
  Boleta,
  DeudaBoleta,
  RawBoleta,
  RawDeudaBoleta,
  RawRegistrarPagoBoleta,
  RegistrarPagoBoletaResponse,
  TarifaPorTipoVehiculo
} from './types'

export function transformBoleta(
  raw: RawBoleta | null | undefined
): Boleta | null {
  if (!raw) return null

  const deudaPendiente = Number(raw.monto) - Number(raw.monto_pagado || 0)

  return {
    playaId: raw.playa_id,
    plazaId: raw.plaza_id,
    fechaHoraInicioAbono: new Date(raw.fecha_hora_inicio_abono),
    fechaGeneracion: new Date(raw.fecha_generacion_boleta),
    fechaVencimiento: new Date(raw.fecha_vencimiento_boleta),
    monto: Number(raw.monto),
    montoPagado: Number(raw.monto_pagado || 0),
    estado: raw.estado,
    deudaPendiente,
    abonadoNombre: raw.abonado_nombre,
    abonadoTelefono: raw.abonado_telefono || null
  }
}

export function transformListBoleta(
  raw: RawBoleta[] | null | undefined
): Boleta[] {
  if (!raw) return []

  return raw.map((item) => transformBoleta(item)).filter(Boolean) as Boleta[]
}

export function transformDeudaBoleta(
  raw: RawDeudaBoleta | null | undefined
): DeudaBoleta | null {
  if (!raw) return null

  const deudaPendiente = Number(raw.monto) - Number(raw.monto_pagado || 0)

  return {
    fechaGeneracion: new Date(raw.fecha_generacion_boleta),
    fechaVencimiento: new Date(raw.fecha_vencimiento_boleta),
    monto: Number(raw.monto),
    montoPagado: Number(raw.monto_pagado || 0),
    deudaPendiente
  }
}

export function transformListDeudaBoleta(
  raw: RawDeudaBoleta[] | null | undefined
): DeudaBoleta[] {
  if (!raw) return []

  return raw
    .map((item) => transformDeudaBoleta(item))
    .filter(Boolean) as DeudaBoleta[]
}

export function transformRegistrarPagoBoleta(
  raw: RawRegistrarPagoBoleta | null | undefined
): RegistrarPagoBoletaResponse | null {
  if (!raw) return null

  return {
    success: true,
    montoPagadoTotal: Number(raw.monto_pagado_total),
    deudaPendiente: Number(raw.deuda_pendiente),
    estadoBoleta: raw.estado_boleta
  }
}

export function transformTarifaPorTipoVehiculo(raw: {
  tipo_vehiculo: string
  precio: number
}): TarifaPorTipoVehiculo {
  return {
    tipoVehiculo: raw.tipo_vehiculo,
    precio: Number(raw.precio)
  }
}

export function transformListTarifaPorTipoVehiculo(
  raw: Array<{ tipo_vehiculo: string; precio: number }> | null | undefined
): TarifaPorTipoVehiculo[] {
  if (!raw) return []

  return raw.map((item) => transformTarifaPorTipoVehiculo(item))
}
