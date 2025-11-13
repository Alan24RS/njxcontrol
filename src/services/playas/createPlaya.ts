'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { CreatePlayaRequest } from '@/schemas/playa'
import { findOrCreateCiudad } from '@/services/ciudades'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { revalidateAdminPath, revalidatePlayas } from '@/utils/revalidation'

import { transformPlaya } from './transformers'
import type { Playa } from './types'

export async function createPlaya(
  data: CreatePlayaRequest
): Promise<ApiResponse<Playa>> {
  const supabase = await createClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      data: null,
      error: 'Debes estar autenticado para crear una playa'
    }
  }

  // Verificar que no exista otra playa del mismo usuario en las mismas coordenadas
  const { data: existingPlaya, error: checkError } = await supabase
    .from('playa')
    .select('playa_id')
    .eq('playa_dueno_id', user.id)
    .eq('latitud', data.latitud)
    .eq('longitud', data.longitud)
    .is('fecha_eliminacion', null)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 es "no rows returned", otros errores son problemas reales
    return {
      data: null,
      error: translateDBError(checkError.message)
    }
  }

  if (existingPlaya) {
    return {
      data: null,
      error: 'Ya tienes una playa registrada en esta ubicación'
    }
  }

  // Crear o encontrar la ciudad
  const ciudadResult = await findOrCreateCiudad({
    nombre: data.ciudad,
    provincia: data.provincia
  })

  if (ciudadResult.error || !ciudadResult.data) {
    return {
      data: null,
      error: ciudadResult.error || 'Error al procesar la ciudad'
    }
  }

  // Crear la playa en la base de datos
  const { data: rawPlaya, error } = await supabase
    .from('playa')
    .insert({
      playa_dueno_id: user.id,
      nombre: data.nombre || null,
      direccion: data.direccion,
      descripcion: data.descripcion || '',
      ciudad_id: ciudadResult.data.id,
      latitud: data.latitud,
      longitud: data.longitud,
      horario: data.horario
    })
    .select(
      `
      *,
      ciudad:ciudad_id (
        ciudad_id,
        nombre,
        provincia
      )
    `
    )
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar cache de playas y página de admin
  await revalidatePlayas()
  await revalidateAdminPath()

  return {
    data: transformPlaya(rawPlaya),
    error: null
  }
}
