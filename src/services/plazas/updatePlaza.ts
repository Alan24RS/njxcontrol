'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformPlaza } from './transformers'
import type { Plaza, RawPlaza } from './types'

export type UpdatePlazaParams = {
  id: string
  identificador?: string | null
  estado?: 'ACTIVO' | 'SUSPENDIDO'
  tipoPlazaId?: number
}

export async function updatePlaza(
  params: UpdatePlazaParams
): Promise<ApiResponse<Plaza>> {
  const supabase = await createClient()
  const { id, ...updateData } = params

  const payload: Partial<RawPlaza> = {
    ...(updateData.identificador !== undefined && {
      identificador: updateData.identificador
    }),
    ...(updateData.estado !== undefined && { estado: updateData.estado }),
    ...(updateData.tipoPlazaId !== undefined && {
      tipo_plaza_id: updateData.tipoPlazaId
    }),
    fecha_modificacion: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('plaza')
    .update(payload)
    .eq('plaza_id', id)
    .select()
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
      error: 'Error al procesar la plaza actualizada'
    }
  }

  return {
    data: transformedData,
    error: null
  }
}
