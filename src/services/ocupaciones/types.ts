import type { MetodoPago } from '@/constants/metodoPago'
import type { ModalidadOcupacion } from '@/constants/modalidadOcupacion'
import type { OcupacionEstado } from '@/constants/ocupacionEstado'
import type { TipoVehiculo } from '@/constants/tipoVehiculo'
import type { PaginationParams } from '@/types/api'

// Tipos raw (directos de la base de datos)
export type RawOcupacion = {
  ocupacion_id: string
  playa_id: string
  plaza_id: string
  playero_id: string
  playero_cierre_id: string | null
  patente: string
  tipo_vehiculo: TipoVehiculo
  modalidad_ocupacion: ModalidadOcupacion
  numero_pago: number | null
  hora_ingreso: string // timestamptz
  hora_egreso: string | null // timestamptz
  fecha_creacion: string // timestamptz
  fecha_modificacion: string | null // timestamptz
  estado: OcupacionEstado
}

// Tipo transformado para el frontend
export type Ocupacion = {
  id: string
  playaId: string
  plazaId: string
  playeroId: string
  playeroCierreId: string | null
  patente: string
  tipoVehiculo: TipoVehiculo
  modalidadOcupacion: ModalidadOcupacion
  numeroPago: number | null
  horaIngreso: Date
  horaEgreso: Date | null
  fechaCreacion: Date
  fechaModificacion: Date | null
  estado: OcupacionEstado
}

// Parámetros para crear una ocupación
export type CreateOcupacionParams = {
  playaId: string
  plazaId: string
  patente: string
  tipoVehiculo: TipoVehiculo
  modalidadOcupacion: ModalidadOcupacion
  numeroPago?: number | null
}

// Parámetros para actualizar una ocupación
// Nota: numeroPago no se actualiza aquí, solo se asigna al finalizar la ocupación
export type UpdateOcupacionParams = {
  plazaId: string
  patente: string
  tipoVehiculo: TipoVehiculo
  modalidadOcupacion: ModalidadOcupacion
}

// Parámetros para obtener ocupaciones
export type GetOcupacionesParams = PaginationParams & {
  playaId?: string
  estado?: OcupacionEstado | OcupacionEstado[]
  playeroId?: string | string[]
  tipoVehiculo?: TipoVehiculo | TipoVehiculo[]
  modalidadOcupacion?: ModalidadOcupacion | ModalidadOcupacion[]
  fromDate?: string // formato: YYYY-MM-DD
  toDate?: string // formato: YYYY-MM-DD
}

// Ocupación con relaciones para el listado
export type OcupacionConRelaciones = Ocupacion & {
  plazaIdentificador: string
  tipoPlazaId: number
  tipoPlazaNombre: string
  plazaEstado: 'ACTIVO' | 'SUSPENDIDO'
  playeroNombre: string
  playeroEmail: string
  playeroCierreNombre: string | null
  playeroCierreEmail: string | null
  playaNombre: string
  playaDireccion: string
  duracionMinutos: number
  duracionFormateada: string
  // Datos del pago (solo disponibles cuando estado es FINALIZADO)
  metodoPago?: MetodoPago | null
  montoPago?: number | null
  pagoObservaciones?: string | null
}

// Tipo raw de la vista v_ocupaciones
export type RawOcupacionVista = {
  ocupacion_id: string
  playa_id: string
  plaza_id: string
  playero_id: string
  playero_cierre_id: string | null
  patente: string
  tipo_vehiculo: TipoVehiculo
  modalidad_ocupacion: ModalidadOcupacion
  numero_pago: number | null
  hora_ingreso: string
  hora_egreso: string | null
  fecha_creacion: string
  fecha_modificacion: string | null
  plaza_identificador: string
  tipo_plaza_id: number
  tipo_plaza_nombre: string
  plaza_estado: 'ACTIVO' | 'SUSPENDIDO'
  playero_nombre: string
  playero_email: string
  playero_cierre_nombre: string | null
  playero_cierre_email: string | null
  playa_nombre: string
  playa_direccion: string
  estado: OcupacionEstado // Campo directo de la tabla ocupacion (puede estar desincronizado)
  ocupacion_estado: OcupacionEstado // Campo calculado por la vista (siempre correcto)
  duracion_minutos: number
  duracion_formateada: string
  // Datos del pago (LEFT JOIN con tabla pago)
  metodo_pago: MetodoPago | null
  monto_pago: string | null // numeric en DB viene como string
  pago_observaciones: string | null
}

// Parámetros para finalizar una ocupación
export type FinalizeOcupacionParams = {
  ocupacionId: string
  metodoPago: MetodoPago
  monto: number
  observaciones?: string
}

// Resultado de una finalización de ocupación exitosa
export type PagoRegistrado = {
  pagoId: string
  numeroPago: number
  monto: number
  horaEgreso: string
}
