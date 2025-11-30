import type {
  PerformancePlayeroRow,
  PerformancePlayeroTimelineRow,
  RawPerformancePlayeroRow,
  RawPerformancePlayeroTimelineRow
} from './types'

export function transformPerformancePlayero(
  raw: RawPerformancePlayeroRow | null | undefined
): PerformancePlayeroRow | null {
  if (!raw) return null

  return {
    playeroId: raw.playero_id,
    playeroNombre: raw.playero_nombre,
    playaId: raw.playa_id,
    playaNombre: raw.playa_nombre,
    totalTurnos: raw.total_turnos,
    totalHorasTrabajadas: raw.total_horas_trabajadas,
    totalDiasTrabajados: raw.total_dias_trabajados,
    ocupacionesAbiertas: raw.ocupaciones_abiertas,
    ocupacionesCerradas: raw.ocupaciones_cerradas,
    totalOcupaciones: raw.total_ocupaciones,
    volumenRecaudadoOcupaciones: raw.volumen_recaudado_ocupaciones,
    boletasGeneradas: raw.boletas_generadas,
    volumenRecaudadoBoletas: raw.volumen_recaudado_boletas,
    volumenRecaudadoTotal: raw.volumen_recaudado_total,
    ticketPromedio: raw.ticket_promedio,
    fechaPrimerTurno: raw.fecha_primer_turno
      ? new Date(raw.fecha_primer_turno)
      : null,
    fechaUltimoTurno: raw.fecha_ultimo_turno
      ? new Date(raw.fecha_ultimo_turno)
      : null
  }
}

export function transformListPerformancePlayero(
  raw: RawPerformancePlayeroRow[] | null | undefined
): PerformancePlayeroRow[] {
  if (!raw) return []
  return raw
    .map((item) => transformPerformancePlayero(item))
    .filter(Boolean) as PerformancePlayeroRow[]
}

export function transformPerformancePlayeroTimeline(
  raw: RawPerformancePlayeroTimelineRow | null | undefined
): PerformancePlayeroTimelineRow | null {
  if (!raw) return null

  let fechaValida: Date | null = null
  if (raw.fecha) {
    const d = new Date(raw.fecha)
    fechaValida = isNaN(d.getTime()) ? null : d
  }
  return {
    fecha: fechaValida,
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
