import { z } from 'zod'

/**
 * Schema base para el formulario (client-side)
 * Los campos de fecha son Date objects directamente
 */
export const recaudacionPorPlayaFiltersSchema = z
  .object({
    fecha_desde: z.date(),
    fecha_hasta: z.date(),
    playa_id: z.string().uuid().optional().nullable()
  })
  .refine((data) => data.fecha_desde <= data.fecha_hasta, {
    message: 'La fecha desde debe ser anterior o igual a la fecha hasta',
    path: ['fecha_hasta']
  })

/**
 * Schema para server action (acepta strings o Date)
 * Usa coerce para convertir strings ISO a Date
 */
export const recaudacionPorPlayaFiltersServerSchema = z
  .object({
    fecha_desde: z.coerce.date(),
    fecha_hasta: z.coerce.date(),
    playa_id: z.string().uuid().optional().nullable()
  })
  .refine((data) => data.fecha_desde <= data.fecha_hasta, {
    message: 'La fecha desde debe ser anterior o igual a la fecha hasta',
    path: ['fecha_hasta']
  })

export type RecaudacionPorPlayaFiltersInput = z.infer<
  typeof recaudacionPorPlayaFiltersSchema
>
