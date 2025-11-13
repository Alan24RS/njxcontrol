'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export interface CreateCiudadRequest {
  nombre: string
  provincia: string
}

export interface Ciudad {
  id: string
  nombre: string
  provincia: string
}

export async function findOrCreateCiudad(
  data: CreateCiudadRequest
): Promise<ApiResponse<Ciudad>> {
  const supabase = await createClient()

  // Primero intentar encontrar la ciudad existente
  const { data: existingCiudad, error: findError } = await supabase
    .from('ciudad')
    .select('ciudad_id, nombre, provincia')
    .eq('nombre', data.nombre)
    .eq('provincia', data.provincia)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    // PGRST116 es "no rows returned", otros errores son problemas reales
    return {
      data: null,
      error: translateDBError(findError.message)
    }
  }

  // Si la ciudad existe, devolverla
  if (existingCiudad) {
    return {
      data: {
        id: existingCiudad.ciudad_id,
        nombre: existingCiudad.nombre,
        provincia: existingCiudad.provincia
      },
      error: null
    }
  }

  // Si no existe, crearla
  const { data: newCiudad, error: createError } = await supabase
    .from('ciudad')
    .insert({
      nombre: data.nombre,
      provincia: data.provincia
    })
    .select('ciudad_id, nombre, provincia')
    .single()

  if (createError) {
    return {
      data: null,
      error: translateDBError(createError.message)
    }
  }

  return {
    data: {
      id: newCiudad.ciudad_id,
      nombre: newCiudad.nombre,
      provincia: newCiudad.provincia
    },
    error: null
  }
}
