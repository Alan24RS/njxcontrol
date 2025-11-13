import { z } from 'zod'

import { dniRegex, nameRegex, phoneRegex } from '@/constants/validations'

import { createAbonoConVehiculosSchema } from './abono'

export const abonadoSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .regex(nameRegex, 'El nombre solo puede contener letras'),

  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .regex(nameRegex, 'El apellido solo puede contener letras'),

  email: z
    .string()
    .email('El formato del email no es válido')
    .optional()
    .or(z.literal('')),

  telefono: z
    .string()
    .regex(
      phoneRegex,
      'El formato del teléfono no es válido (debe ser un número argentino)'
    )
    .optional()
    .or(z.literal('')),

  dni: z
    .string()
    .regex(dniRegex, 'El DNI debe tener 7 u 8 números')
    .transform((val) => val.replace(/\D/g, ''))
})

export const createAbonadoWithAbonoSchema = z.object({
  abonado: abonadoSchema,
  abono: createAbonoConVehiculosSchema
})

export type AbonadoFormData = z.infer<typeof abonadoSchema>
export type CreateAbonadoWithAbonoFormData = z.infer<
  typeof createAbonadoWithAbonoSchema
>
