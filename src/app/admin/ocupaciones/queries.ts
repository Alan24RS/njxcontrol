'use server'

import { getOcupacionById } from '@/services/ocupaciones/getOcupacionById'
import { getOcupaciones } from '@/services/ocupaciones/getOcupaciones'
import type {
  GetOcupacionesParams,
  OcupacionConRelaciones
} from '@/services/ocupaciones/types'
import type { ApiResponse } from '@/types/api'

export async function getOcupacionesAction(
  params: GetOcupacionesParams
): Promise<ApiResponse<OcupacionConRelaciones[]>> {
  return await getOcupaciones(params)
}

export async function getOcupacionByIdAction(
  ocupacionId: string
): Promise<ApiResponse<OcupacionConRelaciones>> {
  return await getOcupacionById(ocupacionId)
}
