import type { PaginationParams } from '@/types/api'

/**
 * Raw database row for playero performance analytics
 */
export type RawPerformancePlayeroRow = {
  playero_id: string
  playero_nombre: string
  playa_id: string
  playa_nombre: string
  total_turnos: number
  total_horas_trabajadas: number
  total_dias_trabajados: number
  ocupaciones_abiertas: number
  ocupaciones_cerradas: number
  total_ocupaciones: number
  volumen_recaudado_ocupaciones: number
  boletas_generadas: number
  volumen_recaudado_boletas: number
  volumen_recaudado_total: number
  ticket_promedio: number
  fecha_primer_turno: string | null
  fecha_ultimo_turno: string | null
}

/**
 * Transformed row for client usage
 */
export type PerformancePlayeroRow = {
  playeroId: string
  playeroNombre: string
  playaId: string
  playaNombre: string
  totalTurnos: number
  totalHorasTrabajadas: number
  totalDiasTrabajados: number
  ocupacionesAbiertas: number
  ocupacionesCerradas: number
  totalOcupaciones: number
  volumenRecaudadoOcupaciones: number
  boletasGeneradas: number
  volumenRecaudadoBoletas: number
  volumenRecaudadoTotal: number
  ticketPromedio: number
  fechaPrimerTurno: Date | null
  fechaUltimoTurno: Date | null
}

export type GetPerformancePlayeroParams = PaginationParams & {
  fecha_desde?: string
  fecha_hasta?: string
  playa_id?: string
  playero_id?: string
  incluir_dias_sin_actividad?: boolean
}

/**
 * Raw database row for playero timeline (daily activity)
 */
export type RawPerformancePlayeroTimelineRow = {
  fecha: string
  total_turnos: number
  total_horas_trabajadas: number
  ocupaciones_cerradas: number
  ocupaciones_abiertas: number
  volumen_recaudado: number
}

/**
 * Transformed timeline row for client usage
 */
export type PerformancePlayeroTimelineRow = {
  fecha: Date
  totalTurnos: number
  totalHorasTrabajadas: number
  ocupacionesCerradas: number
  ocupacionesAbiertas: number
  volumenRecaudado: number
}

export type GetPerformancePlayeroTimelineParams = {
  playero_id: string
  fecha_desde?: string
  fecha_hasta?: string
  intervalo?: 'diario' | 'semanal' | 'mensual'
}
