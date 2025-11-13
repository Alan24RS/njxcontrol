import { z } from 'zod'

export const nameSchema = z
  .string()
  .min(1, 'El nombre es requerido')
  .refine((val) => val.trim() !== '', 'El nombre no puede ser vacío')
  .refine((val) => val.length >= 4, 'El nombre debe ser mayor a 4 caracteres')
  .refine(
    (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(val),
    'El nombre solo puede contener letras, espacios, guiones y apostrofes'
  )
