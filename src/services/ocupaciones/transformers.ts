import type {
  Ocupacion,
  OcupacionConRelaciones,
  RawOcupacion,
  RawOcupacionVista
} from './types'

export function transformOcupacion(
  raw: RawOcupacion | null | undefined
): Ocupacion | null {
  if (!raw) return null

  return {
    id: raw.ocupacion_id,
    playaId: raw.playa_id,
    plazaId: raw.plaza_id,
    playeroId: raw.playero_id,
    playeroCierreId: raw.playero_cierre_id,
    patente: raw.patente,
    tipoVehiculo: raw.tipo_vehiculo,
    modalidadOcupacion: raw.modalidad_ocupacion,
    numeroPago: raw.numero_pago,
    horaIngreso: new Date(raw.hora_ingreso),
    horaEgreso: raw.hora_egreso ? new Date(raw.hora_egreso) : null,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: raw.fecha_modificacion
      ? new Date(raw.fecha_modificacion)
      : null,
    estado: raw.estado
  }
}

export function transformListOcupacion(
  raw: RawOcupacion[] | null | undefined
): Ocupacion[] {
  if (!raw) return []
  return raw
    .map(transformOcupacion)
    .filter((item): item is Ocupacion => item !== null)
}

export function transformOcupacionVista(
  raw: RawOcupacionVista | null | undefined
): OcupacionConRelaciones | null {
  if (!raw) return null

  // CORRECCIÓN: Usar ocupacion_estado (campo calculado) en lugar de estado (campo de tabla)
  // El campo ocupacion_estado siempre está sincronizado con hora_egreso
  const estadoActual = raw.ocupacion_estado

  return {
    id: raw.ocupacion_id,
    playaId: raw.playa_id,
    plazaId: raw.plaza_id,
    playeroId: raw.playero_id,
    playeroCierreId: raw.playero_cierre_id,
    patente: raw.patente,
    tipoVehiculo: raw.tipo_vehiculo,
    modalidadOcupacion: raw.modalidad_ocupacion,
    numeroPago: raw.numero_pago,
    horaIngreso: new Date(raw.hora_ingreso),
    horaEgreso: raw.hora_egreso ? new Date(raw.hora_egreso) : null,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: raw.fecha_modificacion
      ? new Date(raw.fecha_modificacion)
      : null,
    estado: estadoActual,
    plazaIdentificador: raw.plaza_identificador,
    tipoPlazaId: raw.tipo_plaza_id,
    tipoPlazaNombre: raw.tipo_plaza_nombre,
    plazaEstado: raw.plaza_estado,
    playeroNombre: raw.playero_nombre,
    playeroEmail: raw.playero_email,
    playeroCierreNombre: raw.playero_cierre_nombre,
    playeroCierreEmail: raw.playero_cierre_email,
    playaNombre: raw.playa_nombre,
    playaDireccion: raw.playa_direccion,
    duracionMinutos: raw.duracion_minutos,
    duracionFormateada: raw.duracion_formateada,
    metodoPago: raw.metodo_pago ?? null,
    montoPago: raw.monto_pago ? parseFloat(raw.monto_pago) : null,
    pagoObservaciones: raw.pago_observaciones ?? null
  }
}

export function transformListOcupacionVista(
  raw: RawOcupacionVista[] | null | undefined
): OcupacionConRelaciones[] {
  if (!raw) return []
  return raw
    .map(transformOcupacionVista)
    .filter((item): item is OcupacionConRelaciones => item !== null)
}
