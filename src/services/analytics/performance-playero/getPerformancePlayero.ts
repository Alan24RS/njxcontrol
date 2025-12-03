'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListPerformancePlayero } from './transformers'
import type {
  GetPerformancePlayeroParams,
  PerformancePlayeroRow,
  RawPerformancePlayeroRow
} from './types'

/**
 * Get performance analytics data for playeros within a date range
 * Shows: hours worked, closed occupations, revenue generated, etc.
 * Only accessible to DUENO role
 */
export const getPerformancePlayero = cache(
  async (
    args: GetPerformancePlayeroParams = {}
  ): Promise<ApiResponse<PerformancePlayeroRow[]>> => {
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

    try {
      // Build RPC call with filters
      const { data, error } = await supabase.rpc(
        'analytics_performance_playero',
        {
          p_fecha_desde: args.fecha_desde || null,
          p_fecha_hasta: args.fecha_hasta || null,
          p_playa_id: args.playa_id || null,
          p_playero_id: args.playero_id || null,
          p_excluir_irregulares: args.excluir_irregulares || false
        }
      )

      if (error) {
        console.error('[getPerformancePlayero] Error RPC:', error)
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      return {
        data: transformListPerformancePlayero(
          data as RawPerformancePlayeroRow[]
        ),
        error: null
      }
    } catch (err: any) {
      console.error('[getPerformancePlayero] Unexpected error:', err)
      return {
        data: null,
        error:
          err?.message || 'Error inesperado al obtener performance de playeros'
      }
    }
  }
)
