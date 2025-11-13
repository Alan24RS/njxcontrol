'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTurno } from './transformers'
import type { RawTurno, Turno } from './types'

type IniciarTurnoParams = {
  playaId: string
  efectivoInicial: number
}

export async function iniciarTurno(
  params: IniciarTurnoParams
): Promise<ApiResponse<Turno>> {
  const supabase = await createClient()

  const user = await supabase.auth.getUser()

  if (!user.data.user) {
    return {
      data: null,
      error: 'Usuario no autenticado'
    }
  }

  const payload: Omit<RawTurno, 'fecha_hora_salida' | 'efectivo_final'> = {
    playa_id: params.playaId,
    playero_id: user.data.user.id,
    fecha_hora_ingreso: new Date().toISOString(),
    efectivo_inicial: params.efectivoInicial
  }

  const { data, error } = await supabase
    .from('turno')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  const transformedData = transformTurno(data as RawTurno)

  if (!transformedData) {
    return {
      data: null,
      error: 'Error al procesar el turno creado'
    }
  }

  return {
    data: transformedData,
    error: null
  }
}
