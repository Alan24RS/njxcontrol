'use server'

import { revalidatePath } from 'next/cache'

import type { MetodoPago } from '@/constants/metodoPago'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type CreateMetodoPagoPlayaData = {
  playaId: string
  metodoPago: MetodoPago
}

export async function createMetodoPagoPlaya(
  data: CreateMetodoPagoPlayaData
): Promise<ApiResponse<null>> {
  const supabase = await createClient()

  const { error } = await supabase.from('metodo_pago_playa').insert({
    playa_id: data.playaId,
    metodo_pago: data.metodoPago
  })

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/metodos-pago')

  return {
    data: null,
    error: null
  }
}
