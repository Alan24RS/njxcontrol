'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformTipoPlaza } from './transformers'
import type { RawTipoPlaza, TipoPlaza } from './types'

export type UpdateTipoPlazaParams = {
  id: number
  nombre: string
  descripcion?: string | null
  caracteristicas: number[]
}

function arraysAreEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  const sortedArr1 = [...arr1].sort((a, b) => a - b)
  const sortedArr2 = [...arr2].sort((a, b) => a - b)
  return sortedArr1.every((value, index) => value === sortedArr2[index])
}

export async function updateTipoPlaza(
  params: UpdateTipoPlazaParams
): Promise<ApiResponse<TipoPlaza>> {
  const supabase = await createClient()

  try {
    const { data: currentTipoPlazaData, error: fetchPlayaIdError } =
      await supabase
        .from('tipo_plaza')
        .select('playa_id')
        .eq('tipo_plaza_id', params.id)
        .maybeSingle()

    if (fetchPlayaIdError) {
      console.error(
        'Error fetching playa_id for validation:',
        fetchPlayaIdError
      )
      return { data: null, error: 'Error al obtener datos para validación.' }
    }
    if (!currentTipoPlazaData) {
      return {
        data: null,
        error: `Tipo de plaza con ID ${params.id} no encontrado.`
      }
    }
    const playaId = currentTipoPlazaData.playa_id
    const { data: otherTiposPlaza, error: fetchOthersError } = await supabase
      .from('tipo_plaza')
      .select(
        `
        tipo_plaza_id,
        tipo_plaza_caracteristica!inner(
          caracteristica_id
        )
      `
      )
      .eq('playa_id', playaId)
      .neq('tipo_plaza_id', params.id)
      .is('fecha_eliminacion', null)
    if (fetchOthersError) {
      console.error(
        'Error fetching other tipos_plaza for validation:',
        fetchOthersError
      )
      return {
        data: null,
        error: 'Error al obtener tipos de plaza existentes para validación.'
      }
    }
    const otherTiposCaracteristicas: { [key: number]: number[] } = {}
    if (otherTiposPlaza) {
      otherTiposPlaza.forEach((tp) => {
        if (!otherTiposCaracteristicas[tp.tipo_plaza_id]) {
          otherTiposCaracteristicas[tp.tipo_plaza_id] = []
        }

        if (
          tp.tipo_plaza_caracteristica &&
          Array.isArray(tp.tipo_plaza_caracteristica)
        ) {
          tp.tipo_plaza_caracteristica.forEach((tpc) => {
            if (tpc && typeof tpc.caracteristica_id === 'number') {
              otherTiposCaracteristicas[tp.tipo_plaza_id].push(
                tpc.caracteristica_id
              )
            }
          })
        }
      })
    }
    const sortedNewCaracteristicas = [...params.caracteristicas].sort(
      (a, b) => a - b
    )

    for (const tipoPlazaIdStr in otherTiposCaracteristicas) {
      const existingCaracteristicas =
        otherTiposCaracteristicas[parseInt(tipoPlazaIdStr, 10)]
      if (arraysAreEqual(sortedNewCaracteristicas, existingCaracteristicas)) {
        return {
          data: null,
          error:
            'Ya existe otro tipo de plaza con esta combinación exacta de características en esta playa.'
        }
      }
    }

    const { data: result, error: updateRpcError } = await supabase.rpc(
      'update_tipo_plaza_with_caracteristicas',
      {
        p_tipo_plaza_id: params.id,
        p_nombre: params.nombre,
        p_descripcion: params.descripcion || '',
        p_caracteristicas: params.caracteristicas
      }
    )

    if (updateRpcError) {
      return {
        data: null,
        error: translateDBError(updateRpcError.message)
      }
    }

    const updatedTipoPlaza = result?.[0]
    if (!updatedTipoPlaza) {
      return {
        data: null,
        error: 'Error al actualizar el tipo de plaza (RPC no devolvió datos)'
      }
    }

    revalidatePath('/admin/tipos-plaza')
    revalidatePath(`/admin/tipos-plaza/${params.id}`)
    return {
      data: transformTipoPlaza({
        ...updatedTipoPlaza,
        tipo_plaza_id: Number(updatedTipoPlaza.tipo_plaza_id)
      } as RawTipoPlaza),
      error: null
    }
  } catch (error) {
    console.error('Error updating tipo plaza:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido'
    return {
      data: null,
      error: `Error inesperado al actualizar el tipo de plaza: ${errorMessage}`
    }
  }
}
