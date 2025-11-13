'use server'

import { cache } from 'react'

import { PLAYA_ESTADO } from '@/constants/playaEstado'
import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type PlayaStats = {
  total: number
  active: number
  suspended: number
  draft: number
}

export const getPlayaStats = cache(
  async (userId: string): Promise<ApiResponse<PlayaStats>> => {
    const supabase = await createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      }
    }

    try {
      let playas: { estado: string }[] | null = null
      let error: any = null

      if (user.roles.includes(ROL.DUENO)) {
        const result = await supabase
          .from('playa')
          .select('estado')
          .eq('playa_dueno_id', userId)
          .is('fecha_eliminacion', null)

        playas = result.data
        error = result.error
      } else if (user.roles.includes(ROL.PLAYERO)) {
        const result = await supabase
          .from('playero_playa')
          .select(
            `
            playa_id (
              estado
            )
          `
          )
          .eq('playero_id', userId)
          .eq('estado', 'ACTIVO')

        if (result.data) {
          playas = result.data
            .map((item: any) => item.playa_id)
            .filter((playa: any) => playa !== null)
        }
        error = result.error
      }

      if (error) {
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      if (!playas || playas.length === 0) {
        return {
          data: { total: 0, active: 0, suspended: 0, draft: 0 },
          error: null
        }
      }

      const stats = playas.reduce(
        (acc, playa) => {
          acc.total += 1
          switch (playa.estado) {
            case PLAYA_ESTADO.ACTIVO:
              acc.active += 1
              break
            case PLAYA_ESTADO.SUSPENDIDO:
              acc.suspended += 1
              break
            case PLAYA_ESTADO.BORRADOR:
              acc.draft += 1
              break
          }
          return acc
        },
        { total: 0, active: 0, suspended: 0, draft: 0 } as PlayaStats
      )

      return {
        data: stats,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al obtener estadísticas de playas'
      }
    }
  }
)
