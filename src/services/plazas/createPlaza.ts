'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { CreatePlazaRequest } from '@/schemas/plaza'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaza } from './transformers'
import type { Plaza } from './types'

export async function createPlaza(
  data: CreatePlazaRequest
): Promise<ApiResponse<Plaza>> {
  const supabase = await createClient()

  // Crear la plaza en la base de datos
  const { data: rawPlaza, error } = await supabase
    .from('plaza')
    .insert({
      playa_id: data.playaId,
      tipo_plaza_id: data.tipoPlazaId,
      identificador: data.identificador || null,
      estado: data.estado || 'ACTIVO'
    })
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/plazas')

  return {
    data: transformPlaza(rawPlaza),
    error: null
  }
}
