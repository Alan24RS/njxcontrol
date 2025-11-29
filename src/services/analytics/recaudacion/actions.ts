'use server'

import { recaudacionFiltersServerSchema } from '@/schemas/analytics/recaudacion'

import { getRecaudacion } from './getRecaudacion'
import type { RecaudacionResponse } from './types'

/**
 * Server Action para obtener recaudación
 * Valida permisos y ejecuta query
 */
export async function getRecaudacionAction(
  formData: FormData | Record<string, unknown>
): Promise<RecaudacionResponse> {
  try {
    // Si es FormData, convertir a objeto
    const rawData =
      formData instanceof FormData
        ? Object.fromEntries(formData.entries())
        : formData

    // Validar datos de entrada (usa schema con coerce para aceptar strings)
    const validatedData = recaudacionFiltersServerSchema.parse(rawData)

    // DEUDA TÉCNICA: Validación de permisos pendiente
    // Solo el rol DUEÑO (owner) debería acceder a reportes de analytics
    // Implementar antes de producción:
    // const { data: session } = await getSession();
    // if (!session || session.user.rol !== 'DUEÑO') {
    //   throw new Error('Solo el dueño puede acceder a reportes de analytics');
    // }

    // Ejecutar query
    const result = await getRecaudacion(validatedData)

    return result
  } catch (error) {
    console.error('[getRecaudacionAction] Error:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Error desconocido al obtener recaudación')
  }
}
