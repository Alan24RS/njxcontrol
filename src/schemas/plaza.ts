import { z } from 'zod'

export const createPlazaSchema = z.object({
  playaId: z.uuid('ID de playa inválido'),
  tipoPlazaId: z
    .number()
    .int('Debes seleccionar un tipo de plaza')
    .positive('Debes seleccionar un tipo de plaza'),
  identificador: z.string().optional(),
  estado: z.enum(['ACTIVO', 'SUSPENDIDO'])
})

export const updatePlazaFormSchema = z.object({
  identificador: z.string().optional(),
  tipoPlazaId: z.string().min(1, 'Debe seleccionar un tipo de plaza'),
  estado: z.enum(['ACTIVO', 'SUSPENDIDO'])
})

export type CreatePlazaRequest = z.infer<typeof createPlazaSchema>
export type UpdatePlazaRequest = z.infer<typeof updatePlazaFormSchema>
