import { z } from 'zod'

import { METODO_PAGO } from '@/constants/metodoPago'

export const createMetodoPagoPlayaSchema = z.object({
  metodoPago: z
    .enum(Object.values(METODO_PAGO))
    .refine((val) => val !== undefined, {
      message: 'Debe seleccionar un método de pago'
    }),
  playaId: z.uuid('ID de playa inválido')
})

export type CreateMetodoPagoPlayaRequest = z.infer<
  typeof createMetodoPagoPlayaSchema
>
