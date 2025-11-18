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

export type AbonoVigenteDetalle = z.infer<typeof abonoVigenteDetalleSchema>
export type ReporteAbonosVigentes = z.infer<typeof reporteAbonosVigentesSchema>
