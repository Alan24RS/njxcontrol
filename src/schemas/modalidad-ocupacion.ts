import { z } from 'zod'

export const createModalidadOcupacionSchema = z.object({
  modalidadOcupacion: z.enum(['POR_HORA', 'DIARIA', 'SEMANAL', 'ABONO'], {
    message: 'Debe seleccionar una modalidad de ocupación válida'
  }),
  playaId: z.string().uuid('ID de playa inválido')
})

export type CreateModalidadOcupacionRequest = z.infer<
  typeof createModalidadOcupacionSchema
>
