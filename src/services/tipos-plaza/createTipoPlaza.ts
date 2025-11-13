'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { CreateTipoPlazaRequest } from '@/schemas/tipo-plaza'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTipoPlaza } from './transformers'
import type { RawTipoPlaza, TipoPlaza } from './types'

export async function createTipoPlaza(
  data: CreateTipoPlazaRequest
): Promise<ApiResponse<TipoPlaza>> {
  const supabase = await createClient()

  // Usar la función RPC que maneja toda la transacción de forma atómica
  const { data: result, error } = await supabase.rpc(
    'create_tipo_plaza_with_caracteristicas',
    {
      p_playa_id: data.playaId,
      p_nombre: data.nombre,
      p_descripcion: data.descripcion || '',
      p_caracteristicas: data.caracteristicas
    }
  )

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // El resultado debería ser un array con un elemento (el tipo de plaza creado)
  const newTipoPlaza = result?.[0]
  if (!newTipoPlaza) {
    return {
      data: null,
      error: 'Error al crear el tipo de plaza'
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/tipos-plaza')

  return {
    data: transformTipoPlaza(newTipoPlaza as RawTipoPlaza),
    error: null
  }
}
