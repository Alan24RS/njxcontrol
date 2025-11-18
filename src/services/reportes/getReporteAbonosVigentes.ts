'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ReporteAbonosVigentes } from '@/schemas/reportes'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Obtiene el reporte de abonos vigentes por playa
 * Solo accesible para usuarios con rol DUENO
 * Los dueños solo ven las playas que les pertenecen (RLS)
 */
export const getReporteAbonosVigentes = cache(
  async (): Promise<ApiResponse<ReporteAbonosVigentes[]>> => {
    const supabase = await createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      }
    }

    // Verificar que el usuario sea DUENO
    if (!user.roles.includes(ROL.DUENO)) {
      return {
        data: null,
        error: 'No tienes permisos para acceder a los reportes'
      }
    }

    try {
      const { data, error } = await supabase
        .from('abonos_vigentes_por_playa')
        .select('*')
        .order('playa_nombre')

      if (error) {
        return {
          data: null,
          error: translateDBError(error.message)
        }
      }

      return {
        data: data || [],
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al obtener el reporte de abonos vigentes'
      }
    }
  }
)
