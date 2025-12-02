import type {
  PerformancePlayeroTimelineRow,
  RawPerformancePlayeroTimelineRow
} from './types'

export function transformPerformancePlayeroTimeline(
  raw: RawPerformancePlayeroTimelineRow | null | undefined
): PerformancePlayeroTimelineRow | null {
  if (!raw) return null

  return {
    fecha: new Date(raw.fecha),
    totalTurnos: raw.total_turnos,
    totalHorasTrabajadas: raw.total_horas_trabajadas,
    ocupacionesCerradas: raw.ocupaciones_cerradas,
    ocupacionesAbiertas: raw.ocupaciones_abiertas,
    volumenRecaudado: raw.volumen_recaudado
  }
}

export function transformListPerformancePlayeroTimeline(
  raw: RawPerformancePlayeroTimelineRow[] | null | undefined
): PerformancePlayeroTimelineRow[] {
  if (!raw) return []
  return raw
    .map((item) => transformPerformancePlayeroTimeline(item))
    .filter(Boolean) as PerformancePlayeroTimelineRow[]
}
