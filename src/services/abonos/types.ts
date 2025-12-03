import type { Vehiculo } from '../vehiculos/types'

export type RawAbonoVigente = {
  playa_id: string
  plaza_id: string
  fecha_hora_inicio: string
  precio_mensual: number
  estado: 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'
  plaza: {
    identificador: string
    tipo_plaza: {
      nombre: string
    }
  }
  abonado: {
    nombre: string
    apellido: string
    dni: string
  }
  abono_vehiculo: Array<{
    vehiculo: {
      patente: string
      tipo_vehiculo: string
    }
  }>
}

export type AbonoVigente = {
  playaId: string
  playaNombre: string
  plazaId: string
  fechaHoraInicio: Date
  fechaFin: Date | null
  fechaVencimiento: Date | null
  precioMensual: number
  estado: 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'
  plazaIdentificador: string
  tipoPlazaNombre: string
  abonadoNombre: string
  abonadoApellido: string
  abonadoDni: string
  vehiculos: Array<{
    patente: string
    tipoVehiculo: string
  }>
  tieneDeuda: boolean
}

export type RawBoleta = {
  playa_id: string
  plaza_id: string
  fecha_hora_inicio_abono: string
  fecha_generacion_boleta: string
  fecha_vencimiento_boleta: string
  monto: number
  monto_pagado: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
  abonado_nombre?: string
  abonado_telefono?: string | null
}

export type Boleta = {
  playaId: string
  plazaId: string
  fechaHoraInicioAbono: Date
  fechaGeneracion: Date
  fechaVencimiento: Date
  monto: number
  montoPagado: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
  deudaPendiente: number
  abonadoNombre?: string
  abonadoTelefono?: string | null
}

export type RawDeudaBoleta = {
  fecha_generacion_boleta: string
  fecha_vencimiento_boleta: string
  monto: number
  monto_pagado: number
}

export type DeudaBoleta = {
  fechaGeneracion: Date
  fechaVencimiento: Date
  monto: number
  montoPagado: number
  deudaPendiente: number
}

export type DeudaAbonado = {
  tieneDeuda: boolean
  deudaTotal: number
  boletasVencidas: number
  boletasPendientes: DeudaBoleta[]
}

export type DeudaPorPatente = {
  tieneAbono: boolean
  tieneDeuda: boolean
  abonadoNombre: string
  abonadoApellido: string
  abonadoId: number
  deudaTotal: number
  boletasVencidas: number
}

export type GetAbonosVigentesParams = {
  playaId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type FinalizarAbonoResponse = {
  success: boolean
  message: string
}

export type RawRegistrarPagoBoleta = {
  monto_pagado_total: number
  deuda_pendiente: number
  estado_boleta: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
}

export type RegistrarPagoBoletaResponse = {
  success: boolean
  montoPagadoTotal: number
  deudaPendiente: number
  estadoBoleta: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
}

export type TarifaPorTipoVehiculo = {
  tipoVehiculo: string
  precio: number
}

export type TarifasPorTipoPlazaResponse = {
  tarifas: TarifaPorTipoVehiculo[]
  tarifaMaxima: number | null
}

export type RegistrarPagoBoletaParams = {
  playaId: string
  plazaId: string
  fechaHoraInicioAbono: string
  fechaGeneracionBoleta: string
  monto: number
  metodoPago: string
}

export type CreateAbonoWithPaymentParams = {
  nombre: string
  apellido: string
  email?: string
  telefono?: string
  dni: string
  playaId: string
  plazaId: string
  fechaHoraInicio: Date
  vehiculos: Vehiculo[]
  turnoPlayaId: string
  turnoPlayeroId: string
  turnoFechaHoraIngreso: Date
  metodoPago: string
  montoPago: number
}

export type CreateAbonoWithPaymentResponse = {
  abonadoId: number
  abonoPlayaId: string
  abonoPlazaId: string
  abonoFechaHoraInicio: string
}

export type CreateAbonoParams = {
  nombre: string
  apellido: string
  email?: string
  telefono?: string
  dni: string
  playaId: string
  plazaId: string
  fechaHoraInicio: Date | string
  vehiculos: Vehiculo[]
  turnoPlayaId?: string
  turnoPlayeroId?: string
  turnoFechaHoraIngreso?: Date | string
  metodoPago?: string
  montoPago?: number
}

export type CreateAbonoResponse = {
  abonadoId: number
  abonadoNombre: string
  abonadoApellido: string
  abonadoEmail: string | null
  abonadoTelefono: string | null
  abonadoDni: string
  abonadoFechaAlta: string
  abonadoYaExistia?: boolean
  abonoPlayaId: string
  abonoPlazaId: string
  abonoFechaHoraInicio: string
  abonoFechaFin: string | null
  abonoPrecioMensual: number
  abonoEstado: string
  vehiculos: Array<{
    patente: string
    tipo_vehiculo: string
  }>
  boletaInicial?: {
    fechaGeneracion: string
    fechaVencimiento: string
    monto: number
  }
}

export type UpdateAbonoParams = {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
  nuevaPatente?: string | null
  nuevoTipoVehiculo?: 'AUTOMOVIL' | 'MOTOCICLETA' | 'CAMIONETA' | null
  nuevaPlazaId?: string | null
  observaciones?: string | null
}

export type UpdateAbonoResponse = {
  success: boolean
  abono_id: {
    playa_id: string
    plaza_id: string
    fecha_hora_inicio: string
  }
  mensaje: string
  precio_mensual_anterior?: number | null
  precio_mensual_nuevo?: number | null
}

export type AbonoDetails = {
  playaId: string
  plazaId: string
  fechaHoraInicio: Date
  fechaFin: Date | null
  precioMensual: number
  estado: 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'
  plazaIdentificador: string
  tipoPlazaNombre: string
  abonadoNombre: string
  abonadoApellido: string
  abonadoDni: string
  vehiculos: Array<{
    patente: string
    tipoVehiculo: string
  }>
  totalPagado: number
  saldoPendiente: number
  observaciones: string | null
}
