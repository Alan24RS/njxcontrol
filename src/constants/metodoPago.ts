export const METODO_PAGO = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  MERCADO_PAGO: 'MERCADO_PAGO'
}

export const METODO_PAGO_LABEL = {
  [METODO_PAGO.EFECTIVO]: 'Efectivo',
  [METODO_PAGO.TRANSFERENCIA]: 'Transferencia',
  [METODO_PAGO.MERCADO_PAGO]: 'Mercado Pago'
}

export type MetodoPago = keyof typeof METODO_PAGO

export const ESTADO_METODO_PAGO = {
  ACTIVO: 'ACTIVO',
  SUSPENDIDO: 'SUSPENDIDO'
}

export type EstadoMetodoPago = keyof typeof ESTADO_METODO_PAGO

export const ESTADO_METODO_PAGO_LABEL = {
  [ESTADO_METODO_PAGO.ACTIVO]: 'Activo',
  [ESTADO_METODO_PAGO.SUSPENDIDO]: 'Suspendido'
}
