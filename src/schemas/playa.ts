import { z } from 'zod'

export const createPlayaSchema = z
  .object({
    nombre: z
      .string()
      .max(35, 'El nombre no puede tener más de 35 caracteres')
      .optional(),
    descripcion: z.string().optional(),
    displayAddress: z.string().optional(),
    direccion: z.string().min(1, 'La dirección es requerida'),
    ciudad: z.string().min(1, 'La ciudad es requerida'),
    provincia: z.string().min(1, 'La provincia es requerida'),
    latitud: z.number(),
    longitud: z.number(),
    horario: z
      .string()
      .min(
        4,
        'Por favor, indique al menos un día y un horario válido para completar la información'
      )
  })
  .superRefine((data, ctx) => {
    if (data.latitud === 0 || data.longitud === 0) {
      ctx.addIssue({
        path: ['addressSelected'],
        code: 'custom',
        message: 'La dirección es requerida'
      })
    }
  })

export const updatePlayaSchema = z
  .object({
    id: z.string(),
    nombre: z
      .string()
      .max(35, 'El nombre no puede tener más de 35 caracteres')
      .optional(),
    descripcion: z.string().optional(),
    displayAddress: z.string().optional(),
    direccion: z.string().min(1, 'La dirección es requerida'),
    ciudad: z.string().min(1, 'La ciudad es requerida'),
    provincia: z.string().min(1, 'La provincia es requerida'),
    latitud: z.number(),
    longitud: z.number(),
    horario: z
      .string()
      .min(
        4,
        'Por favor, indique al menos un día y un horario válido para completar la información'
      )
  })
  .superRefine((data, ctx) => {
    if (data.latitud === 0 || data.longitud === 0) {
      ctx.addIssue({
        path: ['addressSelected'],
        code: 'custom',
        message: 'La dirección es requerida'
      })
    }
  })

export type CreatePlayaRequest = z.infer<typeof createPlayaSchema> & {
  addressSelected?: boolean
}

export type UpdatePlayaFormRequest = z.infer<typeof updatePlayaSchema> & {
  addressSelected?: boolean
}
