export const DEFAULT_SELECT = `
  playa_id,
  playero_id,
  fecha_hora_ingreso,
  fecha_hora_salida,
  efectivo_inicial,
  efectivo_final
`

export interface RawTurno {
  playa_id: string
  playero_id: string
  fecha_hora_ingreso: string
  fecha_hora_salida: string | null
  efectivo_inicial: number
  efectivo_final: number | null
}

export interface Turno {
  playaId: string
  playeroId: string
  fechaHoraIngreso: Date
  fechaHoraSalida?: Date
  efectivoInicial: number
  efectivoFinal?: number
  playaNombre?: string
  playaDireccion?: string
  playaHorario?: string
  duracionMinutos?: number
  duracionFormateada?: string
}
