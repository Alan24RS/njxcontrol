import { z } from 'zod'

export const mostrarTurnoSchema = z.object({
  playa_id: z.string(),
  fecha_hora_ingreso: z.string(),
  fecha_hora_salida: z.string().nullable(),
  efectivo_inicial: z.number(),
  efectivo_final: z.number().nullable()
})

export const turnosSchema = z.array(mostrarTurnoSchema)
export type MostrarTurnoData = z.infer<typeof mostrarTurnoSchema>

export const crearCerrarTurnoSchema = (efectivoInicial: number) =>
  z
    .object({
      fecha_hora_salida: z.string().min(1, 'La hora de salida es requerida'),
      efectivo_final: z
        .number()
        .min(0, 'El efectivo final no puede ser negativo')
        .optional()
    })
    .refine(
      (data) => {
        if (efectivoInicial > 0) {
          return (
            data.efectivo_final !== undefined &&
            data.efectivo_final !== null &&
            typeof data.efectivo_final === 'number' &&
            data.efectivo_final >= 0
          )
        }
        return true
      },
      {
        message:
          'El efectivo final es obligatorio cuando se registró efectivo inicial',
        path: ['efectivo_final']
      }
    )

export type CerrarTurnoFormData = z.infer<
  ReturnType<typeof crearCerrarTurnoSchema>
>
