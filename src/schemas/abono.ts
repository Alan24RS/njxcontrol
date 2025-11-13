import { z } from 'zod'

export const createAbonoSchema = z.object({
  tiposVehiculo: z
    .array(z.enum(['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA']))
    .min(1, 'Selecciona al menos un tipo de vehículo'),
  tipoPlazaId: z
    .number({
      message: 'Selecciona un tipo de plaza'
    })
    .positive('Selecciona un tipo de plaza'),
  plazaId: z.uuid('Plaza inválida'),
  dni: z
    .string({
      message: 'El DNI es obligatorio'
    })
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(8, 'El DNI debe tener máximo 8 dígitos')
    .regex(/^\d+$/, 'El DNI debe contener solo números'),
  nombre: z
    .string({
      message: 'El nombre es obligatorio'
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre debe tener máximo 50 caracteres'),
  apellido: z
    .string({
      message: 'El apellido es obligatorio'
    })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido debe tener máximo 50 caracteres'),
  email: z.email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  vehiculos: z
    .array(
      z.object({
        patente: z
          .string({
            message: 'La patente es obligatoria'
          })
          .regex(
            /^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$/,
            'Formato de patente inválido (ej: ABC123 o AB123CD)'
          ),
        tipoVehiculo: z.enum(['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA'], {
          message: 'Selecciona el tipo de vehículo'
        })
      })
    )
    .min(1, 'Agrega al menos un vehículo'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO'], {
    message: 'Selecciona un método de pago'
  }),
  playaId: z.string().uuid(),
  montoPago: z.number().positive('El monto debe ser mayor a 0'),
  tarifaMensual: z.number().positive('La tarifa mensual debe ser mayor a 0')
})

export type CreateAbonoFormData = z.infer<typeof createAbonoSchema>

export const createAbonoConVehiculosSchema = z.object({
  playa_id: z.string().uuid(),
  plaza_id: z.string().uuid(),
  fecha_hora_inicio: z.string(),
  vehiculos: z
    .array(
      z.object({
        patente: z
          .string({
            message: 'La patente es obligatoria'
          })
          .regex(
            /^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$/,
            'Formato de patente inválido (ej: ABC123 o AB123CD)'
          ),
        tipo_vehiculo: z.enum(['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA'], {
          message: 'Selecciona el tipo de vehículo'
        })
      })
    )
    .min(1, 'Agrega al menos un vehículo')
})
