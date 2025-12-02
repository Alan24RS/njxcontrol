/**
 * Fila de datos del reporte de recaudación
 */
export interface RecaudacionRow {
  playa_id: string
  playa_nombre: string
  mes: string // ISO string: "2025-11-01T00:00:00Z"
  total_pagos: number
  recaudacion_mensual: number
  ticket_promedio: number
}

/**
 * Fila de datos para gráfico diario
 */
export interface RecaudacionDiariaRow {
  fecha: string // ISO date: "2025-11-26"
  recaudacion_total: number
  recaudacion_abonos: number
  recaudacion_ocupaciones: number
}

/**
 * Fila de detalle por pago para la tabla
 */
export interface PagoDetalleRow {
  pago_id: string
  fecha: string // ISO datetime
  playa_id: string
  playa_nombre: string
  playero_id: string | null
  playero_nombre: string | null
  tipo: 'ABONO' | 'OCUPACION' | 'OTRO'
  monto: number
}

/**
 * Filtros para el reporte
 */
export interface RecaudacionFilters {
  fecha_desde: Date
  fecha_hasta: Date
  playa_id?: string | null // null = todas las playas
  playero_id?: string | null
  tipo?: 'ABONO' | 'OCUPACION' | null
}

/**
 * Respuesta del endpoint
 */
export interface RecaudacionResponse {
  data: RecaudacionRow[]
  dataDiaria: RecaudacionDiariaRow[]
  pagos: PagoDetalleRow[]
  totales: {
    recaudacion_total: number
    recaudacion_abonos: number
    recaudacion_ocupaciones: number
    total_pagos: number
  }
}

/**
 * Formato para TanStack Query
 */
export interface UseRecaudacionResult {
  data: RecaudacionResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}
