import { z } from 'zod'

import {
  MODALIDAD_OCUPACION,
  MODALIDAD_OCUPACION_ESPORADICA
} from '@/constants/modalidadOcupacion'

// Constantes de validación
export const MAX_PATENTE_LENGTH = 20
export const MIN_PATENTE_LENGTH = 6

// Regex para validar patentes argentinas
// Formatos: ABC123 (histórico) o AA123BB (actual)
const PATENTE_REGEX = /^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$/

// Schema para crear una nueva ocupación
export const createOcupacionSchema = z.object({
  playaId: z.string().uuid('ID de playa inválido'),
  plazaId: z
    .string()
    .refine((val) => val !== '', {
      message: 'Selecciona un espacio disponible'
    })
    .refine(
      (val) =>
        !val ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      {
        message: 'ID de plaza inválido'
      }
    ),
  patente: z
    .string()
    .min(MIN_PATENTE_LENGTH, 'La patente debe tener al menos 6 caracteres')
    .max(MAX_PATENTE_LENGTH, 'La patente debe tener máximo 20 caracteres')
    .transform((val) => val.toUpperCase().replace(/[\s-]/g, '')) // Normalizar: mayúsculas y sin espacios/guiones
    .refine((val) => PATENTE_REGEX.test(val), {
      message: 'Formato de patente inválido. Ej: ABC123 o AA123BB'
    }),
  tipoVehiculo: z
    .string({ message: 'Debes seleccionar un tipo de vehículo' })
    .min(1, 'Debes seleccionar un tipo de vehículo'),
  modalidadOcupacion: z
    .enum([
      MODALIDAD_OCUPACION_ESPORADICA.POR_HORA,
      MODALIDAD_OCUPACION_ESPORADICA.DIARIA,
      MODALIDAD_OCUPACION_ESPORADICA.SEMANAL
    ])
    .default(MODALIDAD_OCUPACION.POR_HORA),
  numeroPago: z
    .number()
    .int('El número de pago debe ser un entero')
    .positive('El número de pago debe ser positivo')
    .optional()
    .nullable()
})

// Tipo para el request (input del form)
export type CreateOcupacionRequest = z.input<typeof createOcupacionSchema>

// Tipo para los datos ya validados (output del schema)
export type CreateOcupacionData = z.output<typeof createOcupacionSchema>

// Schema para actualizar una ocupación existente
// No incluye numeroPago porque eso solo se asigna al finalizar la ocupación
export const updateOcupacionSchema = z.object({
  ocupacionId: z.string().uuid('ID de ocupación inválido'),
  plazaId: z
    .string()
    .refine((val) => val !== '', {
      message: 'Selecciona un espacio disponible'
    })
    .refine(
      (val) =>
        !val ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      {
        message: 'ID de plaza inválido'
      }
    ),
  patente: z
    .string()
    .min(MIN_PATENTE_LENGTH, 'La patente debe tener al menos 6 caracteres')
    .max(MAX_PATENTE_LENGTH, 'La patente debe tener máximo 20 caracteres')
    .transform((val) => val.toUpperCase().replace(/[\s-]/g, '')) // Normalizar: mayúsculas y sin espacios/guiones
    .refine((val) => PATENTE_REGEX.test(val), {
      message: 'Formato de patente inválido. Ej: ABC123 o AA123BB'
    }),
  tipoVehiculo: z.string().min(1, 'Selecciona un tipo de vehículo'),
  modalidadOcupacion: z
    .enum([
      MODALIDAD_OCUPACION_ESPORADICA.POR_HORA,
      MODALIDAD_OCUPACION_ESPORADICA.DIARIA,
      MODALIDAD_OCUPACION_ESPORADICA.SEMANAL
    ])
    .default(MODALIDAD_OCUPACION.POR_HORA)
})

// Tipo para el request de actualización (input del form)
export type UpdateOcupacionRequest = z.input<typeof updateOcupacionSchema>

// Tipo para los datos ya validados (output del schema)
export type UpdateOcupacionData = z.output<typeof updateOcupacionSchema>

// Schema para actualizar solo el método de pago de una ocupación finalizada
// (dentro de la ventana de 48 horas)
export const updateMetodoPagoSchema = z.object({
  ocupacionId: z.string().uuid('ID de ocupación inválido'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO'], {
    message: 'Debe seleccionar un método de pago'
  })
})

// Tipo para el request (input del form)
export type UpdateMetodoPagoRequest = z.input<typeof updateMetodoPagoSchema>

// Tipo para los datos ya validados (output del schema)
export type UpdateMetodoPagoData = z.output<typeof updateMetodoPagoSchema>

// Schema para finalizar una ocupación
export const finalizarOcupacionSchema = z.object({
  ocupacionId: z.string().uuid('ID de ocupación inválido'),
  playaId: z.string().uuid('ID de playa inválido'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO'], {
    message: 'Debe seleccionar un método de pago'
  }),
  monto: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  observaciones: z
    .string()
    .max(280, 'Las observaciones no pueden superar los 280 caracteres')
    .optional()
    .or(z.literal(''))
})

// Tipo para el request (input del form)
export type FinalizeOcupacionRequest = z.input<typeof finalizarOcupacionSchema>

// Tipo para los datos ya validados (output del schema)
export type FinalizeOcupacionData = z.output<typeof finalizarOcupacionSchema>
