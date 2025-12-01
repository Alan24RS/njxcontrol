'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import type { Abonado } from './types'

export type UpdateAbonadoParams = {
  abonadoId: number
  nombre?: string
  apellido?: string
  email?: string | null
  telefono?: string | null
  dni?: string
}

export async function updateAbonado(
  params: UpdateAbonadoParams
): Promise<ApiResponse<Abonado>> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}

    if (params.nombre !== undefined) {
      updateData.nombre = params.nombre
    }
    if (params.apellido !== undefined) {
      updateData.apellido = params.apellido
    }
    if (params.email !== undefined) {
      updateData.email = params.email || null
    }
    if (params.telefono !== undefined) {
      updateData.telefono = params.telefono || null
    }
    if (params.dni !== undefined) {
      updateData.dni = params.dni
    }

    const { data, error } = await supabase
      .from('abonado')
      .update(updateData)
      .eq('abonado_id', params.abonadoId)
      .select()
      .single()

    if (error) {
      console.error('Error updating abonado:', error)
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se encontró el abonado para actualizar'
      }
    }

    return {
      data: {
        id: data.abonado_id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        dni: data.dni,
        fechaAlta: new Date(data.fecha_alta),
        estado: data.estado
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al actualizar abonado'
    }
  }
}
