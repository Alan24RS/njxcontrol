import { RawTurno, Turno } from './types'

export function transformTurno(raw: RawTurno): Turno {
  return {
    playaId: raw.playa_id,
    playeroId: raw.playero_id,
    fechaHoraIngreso: new Date(raw.fecha_hora_ingreso),
    fechaHoraSalida: raw.fecha_hora_salida
      ? new Date(raw.fecha_hora_salida)
      : undefined,
    efectivoInicial: raw.efectivo_inicial,
    efectivoFinal: raw.efectivo_final ? raw.efectivo_final : undefined
  }
}

export function transformListTurno(raw: RawTurno[]): Turno[] {
  return raw.map((item) => transformTurno(item))
}
