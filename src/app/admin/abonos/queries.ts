'use server'

import {
  type AbonoDetalles,
  type AbonoVigente,
  type Boleta,
  getAbonoById,
  getAbonosVigentes,
  getBoletasByAbono,
  getPagosByBoleta
} from '@/services/abonos'
import type { ApiResponse } from '@/types/api'

export async function getAbonosVigentesAction(
  playaId?: string
): Promise<ApiResponse<AbonoVigente[]>> {
  const result = await getAbonosVigentes(playaId)
  return {
    data: result.data || null,
    error: result.error || null
  }
}

export async function getAbonoByIdAction(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<ApiResponse<AbonoDetalles>> {
  const result = await getAbonoById(playaId, plazaId, fechaHoraInicio)
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

export async function getPagosByBoletaAction(
  boletaId: string
): Promise<ApiResponse<any[]>> {
  const result = await getPagosByBoleta(boletaId)
  return {
    data: result.data || null,
    error: result.error || null
  }
}
