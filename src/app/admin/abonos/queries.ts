'use server'

import {
  type AbonoDetails,
  type AbonoVigente,
  type Boleta,
  getAbonoById,
  getAbonosVigentes,
  getBoletasByAbono
} from '@/services/abonos'
import type { ApiResponse } from '@/types/api'

export async function getAbonosVigentesAction(
  playaId?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<ApiResponse<AbonoVigente[]>> {
  const result = await getAbonosVigentes({
    playaId,
    sortBy,
    sortOrder
  })
  return {
    data: result.data || null,
    error: result.error || null
  }
}

export async function getBoletasByAbonoAction(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<ApiResponse<Boleta[]>> {
  const result = await getBoletasByAbono(playaId, plazaId, fechaHoraInicio)
  return {
    data: result.data || null,
    error: result.error || null
  }
}

export async function getAbonoByIdAction(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<ApiResponse<AbonoDetails | null>> {
  return await getAbonoById(playaId, plazaId, fechaHoraInicio)
}
