import type { PaginationParams } from '@/types/api'

/**
 * Raw database row for playero timeline analytics
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
 * Transformed row for client usage
 */
export type PerformancePlayeroTimelineRow = {
  fecha: Date | null
  totalTurnos: number
  totalHorasTrabajadas: number
  ocupacionesCerradas: number
  ocupacionesAbiertas: number
  volumenRecaudado: number
}

export type GetPerformancePlayeroTimelineParams = PaginationParams & {
  playero_id: string
  fecha_desde?: string
  fecha_hasta?: string
}
