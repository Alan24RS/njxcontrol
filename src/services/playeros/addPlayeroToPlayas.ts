'use server'

import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { syncPlayeroPlayas } from './syncPlayeroPlayas'

type AddResult = {
  message: string
}

/**
 * Añade/activa las relaciones playero_playa para un playero dado.
 * Reusa la lógica de sincronización existente (reactiva filas soft-deleted o inserta nuevas).
 */
export async function addPlayeroToPlayas(
  playeroId: string,
  playasIds: string[]
): Promise<ApiResponse<AddResult>> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return { data: null, error: 'No autorizado' }
  }

  if (!playasIds || playasIds.length === 0) {
    return { data: null, error: 'Debe enviar al menos una playa para asignar' }
  }

  try {
    // Reuse syncPlayeroPlayas: it will compute cuales agregar y reactivar existentes.
    const result = await syncPlayeroPlayas(playeroId, user.id, playasIds)

    if (result?.error) {
      return { data: null, error: result.error }
    }

    return {
      data: { message: 'Playas asignadas correctamente' },
      error: null
    }
  } catch (error: any) {
    console.error('Error adding playero to playas:', error)
    const translated = translateDBError(error?.message ?? String(error))
    return {
      data: null,
      error: translated || 'Error inesperado al asignar playas'
    }
  }
}
