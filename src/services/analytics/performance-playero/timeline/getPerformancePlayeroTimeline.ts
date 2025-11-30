'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListPerformancePlayeroTimeline } from './transformers'
import type {
  GetPerformancePlayeroTimelineParams,
  PerformancePlayeroTimelineRow,
  RawPerformancePlayeroTimelineRow
} from './types'

/**
 * Get daily timeline data for a specific playero
 * Shows: hours worked, closed occupations, revenue per day
 * Only accessible to DUENO role
 */
export const getPerformancePlayeroTimeline = cache(
  async (
    args: GetPerformancePlayeroTimelineParams
  ): Promise<ApiResponse<PerformancePlayeroTimelineRow[]>> => {
    const supabase = await createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      }
    }

    if (!user.roles.includes(ROL.DUENO)) {
      return {
        data: null,
        error: 'No tienes permisos para acceder a esta información'
      }
    }

    if (!args.playero_id) {
      return {
        data: null,
        error: 'Se requiere el ID del playero'
      }
    }

    try {
      const { data, error } = await supabase.rpc(
        'analytics_performance_playero_timeline',
        {
          p_playero_id: args.playero_id,
          p_fecha_desde: args.fecha_desde || null,
          p_fecha_hasta: args.fecha_hasta || null
        }
      )

      if (error) {
        console.error('[getPerformancePlayeroTimeline] Error RPC:', error)
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      return {
        data: transformListPerformancePlayeroTimeline(
          data as RawPerformancePlayeroTimelineRow[]
        ),
        error: null
      }
    } catch (err: any) {
      console.error('[getPerformancePlayeroTimeline] Unexpected error:', err)
      return {
        data: null,
        error:
          err?.message ||
          'Error inesperado al obtener timeline de performance de playero'
      }
    }
  }
)
