import { z } from 'zod'

import { MODALIDAD_OCUPACION } from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO } from '@/constants/tipoVehiculo'

export const createTarifaSchema = z.object({
  playaId: z.string().uuid('ID de playa inválido'),
  tipoPlazaId: z.number().int().positive('Debe seleccionar un tipo de plaza'),
  modalidadOcupacion: z
    .enum(Object.values(MODALIDAD_OCUPACION) as [string, ...string[]], {
      message: 'Debe seleccionar una modalidad de ocupación'
    })
    .refine((val) => val !== '', {
      message: 'Debe seleccionar una modalidad de ocupación'
    }),
  tipoVehiculo: z
    .enum(Object.values(TIPO_VEHICULO) as [string, ...string[]], {
      message: 'Debe seleccionar un tipo de vehículo'
    })
    .refine((val) => val !== '', {
      message: 'Debe seleccionar un tipo de vehículo'
    }),
  precioBase: z
    .number({ message: 'El precio base es requerido' })
    .min(0.01, 'El precio base debe ser mayor a 0')
    .max(999999.99, 'El precio base es demasiado alto')
})

export const updateTarifaSchema = z.object({
  precioBase: z
    .number()
    .min(0.01, 'El precio base debe ser mayor a 0')
    .max(999999.99, 'El precio base es demasiado alto')
})

export type CreateTarifaRequest = z.infer<typeof createTarifaSchema>
export type UpdateTarifaRequest = z.infer<typeof updateTarifaSchema>
