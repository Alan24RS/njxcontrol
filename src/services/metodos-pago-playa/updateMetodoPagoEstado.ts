'use server'

import { revalidatePath } from 'next/cache'

import type { EstadoMetodoPago } from '@/constants/metodoPago'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformMetodoPagoPlaya } from './transformers'
import type { MetodoPagoPlaya, RawMetodoPagoPlaya } from './types'

export type UpdateMetodoPagoEstadoParams = {
  playaId: string
  metodoPago: string
  estado: EstadoMetodoPago
}

export async function updateMetodoPagoEstado(
  params: UpdateMetodoPagoEstadoParams
): Promise<ApiResponse<MetodoPagoPlaya>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metodo_pago_playa')
    .update({
      estado: params.estado,
      fecha_modificacion: new Date().toISOString()
    })
    .eq('playa_id', params.playaId)
    .eq('metodo_pago', params.metodoPago)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  revalidatePath('/admin/metodos-pago')

  return {
    data: transformMetodoPagoPlaya(data as RawMetodoPagoPlaya),
    error: null
  }
}
