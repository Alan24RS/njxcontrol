'use server'

import { revalidatePath } from 'next/cache'

import type { ModalidadOcupacion } from '@/constants/modalidadOcupacion'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type CreateModalidadOcupacionData = {
  playaId: string
  modalidadOcupacion: ModalidadOcupacion
}

export async function createModalidadOcupacion(
  data: CreateModalidadOcupacionData
): Promise<ApiResponse<null>> {
  const supabase = await createClient()

  const { error } = await supabase.from('modalidad_ocupacion_playa').insert({
    playa_id: data.playaId,
    modalidad_ocupacion: data.modalidadOcupacion
  })

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // Revalidar las páginas para mostrar los cambios
  revalidatePath('/admin/modalidades-ocupacion')

  return {
    data: null,
    error: null
  }
}
