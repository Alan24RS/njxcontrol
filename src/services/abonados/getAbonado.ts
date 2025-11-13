'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformAbonado } from './transformers'
import type { Abonado, RawAbonado } from './types'

export const getAbonado = async (
  dni: string
): Promise<ApiResponse<Abonado | null>> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('abonado')
    .select('*')
    .eq('dni', dni)
    .maybeSingle()

  if (error) {
    return { data: null, error: translateDBError(error.message) }
  }

  return { data: transformAbonado(data as RawAbonado), error: null }
}
