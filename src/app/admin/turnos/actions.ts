'use server'

import { revalidatePath } from 'next/cache'

import { turnosSchema } from '@/schemas/turnos'
import { getTurno, getTurnos, type Turno, updateTurno } from '@/services/turnos'
import type { ApiResponse } from '@/types/api'

interface TurnosState {
  data: any[] | null
  error: string | null
}

export async function obtenerTurnos(
  _prevState: TurnosState,
  playaId?: string | undefined
): Promise<TurnosState> {
  const response = await getTurnos({ playaId })

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Error al obtener turnos' }
  }

  const result = turnosSchema.safeParse(response.data)
  if (!result.success) {
    console.error(result.error)
    return { data: null, error: 'Datos inválidos desde el backend' }
  }

  return { data: result.data, error: null }
}

export async function getTurnoActivoAction(): Promise<
  ApiResponse<Turno | null>
> {
  return await getTurno({ activo: true })
}

export async function updateTurnoAction(params: {
  playaId: string
  fechaHoraSalida?: string | null
  efectivoFinal?: number | null
}): Promise<ApiResponse<Turno>> {
  const result = await updateTurno(params)

  if (!result.error) {
    revalidatePath('/admin/turnos')
    revalidatePath('/admin/turnos/cerrar-turno')
  }

  return result
}
