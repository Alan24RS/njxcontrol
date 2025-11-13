'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTipoPlaza } from './transformers'
import type { RawTipoPlazaWithCaracteristicas, TipoPlaza } from './types'

export async function getTipoPlaza(
  id: number
): Promise<ApiResponse<TipoPlaza>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tipo_plaza')
    .select(
      `
      tipo_plaza_id,
      playa_id,
      nombre,
      descripcion,
      fecha_creacion,
      fecha_modificacion,
      fecha_eliminacion,
      tipo_plaza_caracteristica(
        caracteristica(
          caracteristica_id,
          nombre,
          fecha_creacion,
          fecha_modificacion
        )
      )
    `
    )
    .eq('tipo_plaza_id', id)
    .is('fecha_eliminacion', null)
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  if (!data) {
    return {
      data: null,
      error: 'Tipo de plaza no encontrado'
    }
  }

  // Transformar usando la función existente para tipos con características
  const tipoPlaza = transformTipoPlaza(
    data as unknown as RawTipoPlazaWithCaracteristicas
  )

  return {
    data: tipoPlaza,
    error: null
  }
}
