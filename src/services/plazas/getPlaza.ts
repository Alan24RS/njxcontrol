'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaza } from './transformers'
import type { Plaza, RawPlazaWithRelations } from './types'

const DEFAULT_SELECT = `
*,
playa:playa_id (
  playa_id,
  nombre,
  direccion,
  ciudad:ciudad_id (
    nombre,
    provincia
  )
),
tipo_plaza!plaza_tipo_plaza_fkey(
  tipo_plaza_id,
  nombre,
  descripcion
)
`

export const getPlaza = cache(
  async (id: string): Promise<ApiResponse<Plaza>> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('plaza')
      .select(DEFAULT_SELECT)
      .eq('plaza_id', id)
      .single()

    if (error) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    const transformedData = transformPlaza(data as any)

    if (!transformedData) {
      return {
        data: null,
        error: 'Plaza no encontrada'
      }
    }

    const rawData = data as RawPlazaWithRelations

    return {
      data: {
        ...transformedData,
        playa: rawData.playa
          ? {
              id: rawData.playa.playa_id,
              nombre: rawData.playa.nombre,
              direccion: rawData.playa.direccion,
              ciudad: rawData.playa.ciudad
                ? {
                    nombre: rawData.playa.ciudad.nombre,
                    provincia: rawData.playa.ciudad.provincia
                  }
                : undefined
            }
          : undefined,
        tipoPlaza: rawData.tipo_plaza
          ? {
              id: rawData.tipo_plaza.tipo_plaza_id,
              nombre: rawData.tipo_plaza.nombre,
              descripcion: rawData.tipo_plaza.descripcion
            }
          : undefined
      },
      error: null
    }
  }
)
