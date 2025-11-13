import { z } from 'zod'

import { nameSchema } from '@/schemas/shared'

export const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const signupSchema = z
  .object({
    email: z.email('Dirección de correo inválida'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: nameSchema
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  })

export const forgotPasswordSchema = z.object({
  email: z.email('Dirección de correo inválida')
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  })

export const signupPlayeroSchema = z
  .object({
    token: z.string().min(1, 'Token de invitación requerido'),
    name: nameSchema,
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  })

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token de invitación requerido')
})
