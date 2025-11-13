import { z } from 'zod'

import { TIPO_VEHICULO } from '@/constants/tipoVehiculo'

export const createTipoVehiculoPlayaSchema = z.object({
  tipoVehiculo: z
    .enum(Object.values(TIPO_VEHICULO) as [string, ...string[]])
    .refine((val) => val !== undefined, {
      message: 'Debe seleccionar un tipo de vehículo'
    }),
  playaId: z.uuid('ID de playa inválido')
})

export type CreateTipoVehiculoPlayaRequest = z.infer<
  typeof createTipoVehiculoPlayaSchema
>
