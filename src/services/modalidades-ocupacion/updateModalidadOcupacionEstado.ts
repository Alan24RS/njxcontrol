'use server'

import { revalidatePath } from 'next/cache'

import type { EstadoModalidadOcupacion } from '@/constants/modalidadOcupacion'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformModalidadOcupacion } from './transformers'
import type {
  ModalidadOcupacionPlaya,
  RawModalidadOcupacionPlaya
} from './types'

export type UpdateModalidadOcupacionEstadoParams = {
  playaId: string
  modalidadOcupacion: string
  estado: EstadoModalidadOcupacion
}

export async function updateModalidadOcupacionEstado(
  params: UpdateModalidadOcupacionEstadoParams
): Promise<ApiResponse<ModalidadOcupacionPlaya>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modalidad_ocupacion_playa')
    .update({
      estado: params.estado,
      fecha_modificacion: new Date().toISOString()
    })
    .eq('playa_id', params.playaId)
    .eq('modalidad_ocupacion', params.modalidadOcupacion)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  revalidatePath('/admin/modalidades-ocupacion')

  return {
    data: transformModalidadOcupacion(data as RawModalidadOcupacionPlaya),
    error: null
  }
}
