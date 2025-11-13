'use server'

import { revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/constants/cache'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaya } from './transformers'
import type { Playa } from './types'

export type UpdatePlayaRequest = {
  nombre?: string | null
  descripcion?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  latitud?: number
  longitud?: number
  horario?: string
}

const DEFAULT_SELECT = `
*,
ciudad:ciudad_id (
  ciudad_id,
  nombre,
  provincia
)
`

export const updatePlaya = async (
  playaId: string,
  data: UpdatePlayaRequest
): Promise<ApiResponse<Playa | null>> => {
  const supabase = await createClient()

  const updateData: Record<string, any> = {}

  if (data.nombre !== undefined) updateData.nombre = data.nombre
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
  if (data.direccion !== undefined) updateData.direccion = data.direccion
  if (data.latitud !== undefined) updateData.latitud = data.latitud
  if (data.longitud !== undefined) updateData.longitud = data.longitud
  if (data.horario !== undefined) updateData.horario = data.horario

  // Si se proporciona ciudad y provincia, buscar o crear la ciudad
  if (data.ciudad && data.provincia) {
    const { data: ciudadData, error: ciudadError } = await supabase
      .from('ciudad')
      .select('ciudad_id')
      .eq('nombre', data.ciudad)
      .eq('provincia', data.provincia)
      .single()

    if (ciudadError && ciudadError.code !== 'PGRST116') {
      return {
        data: null,
        error: translateDBError(ciudadError.message)
      }
    }

    if (!ciudadData) {
      // Crear nueva ciudad
      const { data: nuevaCiudad, error: errorNuevaCiudad } = await supabase
        .from('ciudad')
        .insert({
          nombre: data.ciudad,
          provincia: data.provincia
        })
        .select('ciudad_id')
        .single()

      if (errorNuevaCiudad) {
        return {
          data: null,
          error: translateDBError(errorNuevaCiudad.message)
        }
      }

      updateData.ciudad_id = nuevaCiudad.ciudad_id
    } else {
      updateData.ciudad_id = ciudadData.ciudad_id
    }
  }

  const { data: playaData, error } = await supabase
    .from('playa')
    .update(updateData)
    .eq('playa_id', playaId)
    .is('fecha_eliminacion', null)
    .select(DEFAULT_SELECT)
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar caché
  revalidateTag(CACHE_TAGS.PLAYAS)
  revalidateTag(`playa-${playaId}`)

  if (!playaData) {
    return {
      data: null,
      error: 'No se pudo actualizar la playa'
    }
  }

  return {
    data: transformPlaya(playaData),
    error: null
  }
}
