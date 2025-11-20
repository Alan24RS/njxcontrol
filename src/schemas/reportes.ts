import { z } from 'zod'

export const abonoVigenteDetalleSchema = z.object({
  abonado_id: z.number(),
  nombre_completo: z.string(),
  dni: z.string(),
  plaza_id: z.string().uuid(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  plaza_identificador: z.string()
})

export const reporteAbonosVigentesSchema = z.object({
  playa_id: z.string().uuid(),
  playa_nombre: z.string(),
  direccion: z.string().nullable(),
  latitud: z.number().nullable(),
  longitud: z.number().nullable(),
  total_abonos_vigentes: z.number(),
  plazas_ocupadas_por_abono: z.number(),
  detalle_abonos: z.array(abonoVigenteDetalleSchema)
})

export const ocupacionDetalleSchema = z.object({
  ocupacion_id: z.string().uuid(),
  plaza_identificador: z.string(),
  patente: z.string(),
  tipo_vehiculo: z.string(),
  modalidad: z.string(),
  hora_ingreso: z.string(),
  hora_egreso: z.string().nullable(),
  monto_pago: z.number().nullable(),
  metodo_pago: z.string().nullable()
})

export const pagoPorMetodoSchema = z.object({
  metodo_pago: z.string(),
  monto: z.number()
})

export const reporteOcupacionesPorTurnoSchema = z.object({
  playa_id: z.string().uuid(),
  playa_nombre: z.string(),
  direccion: z.string().nullable(),
  playero_id: z.string().uuid(),
  playero_nombre: z.string(),
  turno_fecha_inicio: z.string(),
  turno_fecha_fin: z.string().nullable(),
  turno_activo: z.boolean(),
  total_ocupaciones: z.number(),
  ocupaciones_finalizadas: z.number(),
  ocupaciones_activas: z.number(),
  recaudacion_total: z.number(),
  ocupaciones: z.array(ocupacionDetalleSchema),
  pagos_por_metodo: z.array(pagoPorMetodoSchema)
})

export type AbonoVigenteDetalle = z.infer<typeof abonoVigenteDetalleSchema>
export type ReporteAbonosVigentes = z.infer<typeof reporteAbonosVigentesSchema>
export type OcupacionDetalle = z.infer<typeof ocupacionDetalleSchema>
export type PagoPorMetodo = z.infer<typeof pagoPorMetodoSchema>
export type ReporteOcupacionesPorTurno = z.infer<
  typeof reporteOcupacionesPorTurnoSchema
>
