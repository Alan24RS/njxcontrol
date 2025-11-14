'use server'

import { getTurno, getTurnos } from '@/services/turnos'
import type { Turno } from '@/services/turnos/types'
import type { ApiResponse } from '@/types/api'

export async function getTurnoActivoAction() {
  return await getTurno({ activo: true })
}

export async function getTurnosAction(params?: {
  playaId?: string | string[]
  fromDate?: string
  toDate?: string
  includeFilters?: boolean
}): Promise<ApiResponse<Turno[]>> {
  return await getTurnos(params)
}
