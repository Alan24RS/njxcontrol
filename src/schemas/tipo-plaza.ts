import { z } from 'zod'

import { nameSchema } from '@/schemas/shared'

export const createTipoPlazaSchemaBase = z.object({
  nombre: nameSchema
    .min(4, 'El nombre debe tener al menos 4 caracteres')
    .max(20, 'El nombre debe tener menos de 20 caracteres'),
  descripcion: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 4 && val.length <= 100), {
      message: 'La descripción debe tener entre 4 y 100 caracteres'
    }),
  caracteristicas: z.array(z.number()).optional().default([])
})

export const createTipoPlazaSchema = z.object({
  ...createTipoPlazaSchemaBase.shape,
  playaId: z.uuid('ID de playa inválido')
})

export const updateTipoPlazaSchema = z.object({
  id: z.number().positive('ID de tipo de plaza inválido'),
  ...createTipoPlazaSchemaBase.shape
})

export type CreateTipoPlazaRequest = z.infer<typeof createTipoPlazaSchema>
export type UpdateTipoPlazaRequest = z.infer<typeof updateTipoPlazaSchema>
