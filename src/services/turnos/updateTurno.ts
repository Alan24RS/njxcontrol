'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTurno } from './transformers'
import type { RawTurno, Turno } from './types'

export type UpdateTurnoParams = {
  playaId: string
  fechaHoraSalida?: string | null
  efectivoFinal?: number | null
}

export async function updateTurno(
  params: UpdateTurnoParams
): Promise<ApiResponse<Turno>> {
  const supabase = await createClient()
  const { playaId, ...updateData } = params

  const payload: Partial<RawTurno> = {
    ...(updateData.fechaHoraSalida !== undefined && {
      fecha_hora_salida: updateData.fechaHoraSalida
    }),
    ...(updateData.efectivoFinal !== undefined && {
      efectivo_final: updateData.efectivoFinal
    })
  }

  const { data, error } = await supabase
    .from('turno')
    .update(payload)
    .eq('playa_id', playaId)
    .is('fecha_hora_salida', null)
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
      error: 'Error al procesar el turno actualizado'
    }
  }

  return {
    data: transformedData,
    error: null
  }
}
