'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListCaracteristica } from './transformers'
import type {
  Caracteristica,
  GetCaracteristicasParams,
  RawCaracteristica
} from './types'

export const getCaracteristicas = cache(
  async (
    args?: GetCaracteristicasParams
  ): Promise<ApiResponse<Caracteristica[]>> => {
    const supabase = await createClient()

    let queryBuilder = supabase.from('caracteristica').select('*')

    // Si hay un query de búsqueda, filtrar por nombre
    if (args?.query) {
      queryBuilder = queryBuilder.ilike('nombre', `%${args.query}%`)
    }

    const { data, error } = await queryBuilder.order('nombre', {
      ascending: true
    })

    if (error) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    return {
      data: transformListCaracteristica(data as RawCaracteristica[]),
      error: null
    }
  }
)
