'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ReporteOcupacionesPorTurno } from '@/schemas/reportes'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Obtiene el reporte de ocupaciones segmentadas por turnos
 * Solo accesible para usuarios con rol DUENO
 * Los dueños solo ven los turnos de sus playas (RLS)
 *
 * @param playaId - Opcional: filtrar por una playa específica
 * @param fechaDesde - Opcional: filtrar turnos desde una fecha
 * @param fechaHasta - Opcional: filtrar turnos hasta una fecha
 */
export const getReporteOcupacionesPorTurno = cache(
  async (
    playaId?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<ApiResponse<ReporteOcupacionesPorTurno[]>> => {
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
      let query = supabase
        .from('reportes_ocupaciones_por_turno')
        .select('*')
        .order('turno_fecha_inicio', { ascending: false })

      // Aplicar filtros opcionales
      if (playaId) {
        query = query.eq('playa_id', playaId)
      }

      if (fechaDesde) {
        query = query.gte('turno_fecha_inicio', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('turno_fecha_inicio', fechaHasta)
      }

      const { data, error } = await query

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
            : 'Error desconocido al obtener el reporte de ocupaciones por turno'
      }
    }
  }
)
