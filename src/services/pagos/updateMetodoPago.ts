'use server'

import { revalidatePath } from 'next/cache'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Actualiza solo el método de pago de una ocupación finalizada.
 * Solo permite la actualización si la ocupación finalizó hace menos de 48 horas.
 *
 * Las validaciones de seguridad se realizan a nivel de base de datos mediante RLS:
 * - Usuario autenticado (PLAYERO o DUENO)
 * - La ocupación existe y está finalizada
 * - El método de pago es válido ('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO')
 * - La ocupación finalizó hace menos de 48 horas
 * - El usuario tiene permiso para editar (creador o dueño de la playa)
 *
 * @param ocupacionId - ID de la ocupación
 * @param metodoPago - Nuevo método de pago
 * @returns ApiResponse con resultado de la operación
 */
export async function updateMetodoPagoOcupacion(
  ocupacionId: string,
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO'
): Promise<ApiResponse<{ success: boolean }>> {
  const supabase = await createClient()

  // Verificar autenticación
  const user = await getAuthenticatedUser()
  if (!user) {
    return {
      data: null,
      error: 'Usuario no autenticado'
    }
  }

  // Actualizar el método de pago (las validaciones las maneja RLS)
  const { error: updateError } = await supabase
    .from('pago')
    .update({ metodo_pago: metodoPago })
    .eq('ocupacion_id', ocupacionId)

  if (updateError) {
    return {
      data: null,
      error: translateDBError(updateError)
    }
  }

  // Revalidar caché de ocupaciones
  revalidatePath('/admin/ocupaciones')
  revalidatePath(`/admin/ocupaciones/${ocupacionId}`)

  return {
    data: { success: true },
    error: null
  }
}
