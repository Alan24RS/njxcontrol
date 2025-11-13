import { z } from 'zod'

export const invitarPlayeroSchema = z
  .object({
    nombre: z.string().optional(),
    email: z.email('Email inválido'),
    playasIds: z.array(z.string()).min(1, 'Debe asignar al menos una playa'),
    usuarioExiste: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.usuarioExiste === false) {
        return data.nombre && data.nombre.length >= 2
      }
      return true
    },
    {
      message: 'El nombre es requerido para nuevos usuarios',
      path: ['nombre']
    }
  )

export const createPlayeroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Email inválido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  playasIds: z.array(z.string()).min(1, 'Debe asignar al menos una playa')
})

export type InvitarPlayeroRequest = z.infer<typeof invitarPlayeroSchema>
export type CreatePlayeroRequest = z.infer<typeof createPlayeroSchema>
