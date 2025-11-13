import { z } from 'zod'

import { METODO_PAGO } from '@/constants/metodoPago'
import { MODALIDAD_OCUPACION } from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO } from '@/constants/tipoVehiculo'
import { createPlayaSchema } from '@/schemas/playa'

import { createTipoPlazaSchemaBase } from './tipo-plaza'

// Schema para datos de la playa (Paso 1) - usa el esquema base
export const playaStepSchema = createPlayaSchema

// Schema para tipos de plaza (Paso 2)
export const tiposPlazaStepSchema = z.object({
  tiposPlaza: z.array(createTipoPlazaSchemaBase).optional().default([])
})

// Schema para tarifas (Paso 3) - ahora incluye modalidades y métodos de pago dinámicos
export const tarifasStepSchema = z.object({
  tarifas: z
    .array(
      z.object({
        tipoPlazaIndex: z.number().min(0, 'Debe seleccionar un tipo de plaza'),
        modalidadOcupacion: z.enum(
          Object.values(MODALIDAD_OCUPACION) as [string, ...string[]]
        ),
        tipoVehiculo: z.enum(
          Object.values(TIPO_VEHICULO) as [string, ...string[]]
        ),
        precioBase: z
          .number()
          .min(0.01, 'El precio base debe ser mayor a 0')
          .max(999999.99, 'El precio base es demasiado alto')
      })
    )
    .optional()
    .default([])
})

// Schema para plazas (Paso 4)
export const plazasStepSchema = z.object({
  plazas: z
    .array(
      z.object({
        tipoPlazaIndex: z.number().min(0, 'Debe seleccionar un tipo de plaza'),
        identificador: z.string().optional().default(''),
        generatedFrom: z
          .object({
            tipoPlazaIndex: z.number(),
            cantidad: z.number()
          })
          .optional()
      })
    )
    .optional()
    .default([])
})

// Schema para métodos de pago (Paso 5)
export const metodosPagoStepSchema = z.object({
  metodosPago: z
    .array(
      z.object({
        metodoPago: z.enum(Object.values(METODO_PAGO) as [string, ...string[]])
      })
    )
    .optional()
    .default([])
})

// Schema completo del formulario - 5 pasos con opcionales
export const welcomeSetupSchema = z.object({
  // Paso 1: Datos básicos de la playa (OBLIGATORIO)
  playa: playaStepSchema,

  // Paso 2: Tipos de plaza (OPCIONAL pero requerido para tarifas y plazas)
  tiposPlaza: tiposPlazaStepSchema.shape.tiposPlaza,

  // Paso 3: Tarifas (OPCIONAL, requiere tipos de plaza)
  tarifas: tarifasStepSchema.shape.tarifas,

  // Paso 4: Plazas (OPCIONAL, requiere tipos de plaza)
  plazas: plazasStepSchema.shape.plazas,

  // Paso 5: Métodos de pago (OPCIONAL)
  metodosPago: metodosPagoStepSchema.shape.metodosPago
})

export type WelcomeSetupFormData = z.infer<typeof welcomeSetupSchema>
export type PlayaStepData = z.infer<typeof playaStepSchema>
export type TiposPlazaStepData = z.infer<typeof tiposPlazaStepSchema>
export type TarifasStepData = z.infer<typeof tarifasStepSchema>
export type PlazasStepData = z.infer<typeof plazasStepSchema>
export type MetodosPagoStepData = z.infer<typeof metodosPagoStepSchema>
