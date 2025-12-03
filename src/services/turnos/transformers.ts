import { RawTurno, Turno } from './types'

function calcularDuracion(
  fechaIngreso: Date,
  fechaSalida?: Date
): { minutos: number; formateada: string } {
  if (!fechaSalida) {
    return { minutos: 0, formateada: '-' }
  }

  const diffMs = fechaSalida.getTime() - fechaIngreso.getTime()
  const minutos = Math.floor(diffMs / (1000 * 60))

  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60

  const formateada = horas === 0 ? `${mins}min` : `${horas}h ${mins}min`

  return { minutos, formateada }
}

export function transformTurno(raw: RawTurno): Turno {
  const fechaHoraIngreso = new Date(raw.fecha_hora_ingreso)
  const fechaHoraSalida = raw.fecha_hora_salida
    ? new Date(raw.fecha_hora_salida)
    : undefined

  const duracion = calcularDuracion(fechaHoraIngreso, fechaHoraSalida)

  return {
    playaId: raw.playa_id,
    playeroId: raw.playero_id,
    fechaHoraIngreso,
    fechaHoraSalida,
    efectivoInicial: raw.efectivo_inicial,
    efectivoFinal: raw.efectivo_final ? raw.efectivo_final : undefined,
    duracionMinutos: duracion.minutos > 0 ? duracion.minutos : undefined,
    duracionFormateada: duracion.minutos > 0 ? duracion.formateada : undefined
  }
}

export function transformListTurno(raw: RawTurno[]): Turno[] {
  return raw.map((item) => transformTurno(item))
}
