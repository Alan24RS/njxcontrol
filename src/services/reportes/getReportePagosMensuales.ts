'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ReportePagosMensuales } from '@/schemas/reportes'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Obtiene el reporte de pagos consolidados (ocupaciones + boletas) por mes
 * Accesible para DUENO (ve todas sus playas) y PLAYERO (ve solo sus propios pagos)
 *
 * @param playaId - Opcional: filtrar por una playa específica
 * @param playeroId - Opcional: filtrar por un playero específico (solo para dueños)
 * @param anio - Opcional: filtrar por año
 * @param mes - Opcional: filtrar por mes (1-12)
 */
export const getReportePagosMensuales = cache(
  async (
    playaId?: string,
    playeroId?: string,
    anio?: number,
    mes?: number
  ): Promise<ApiResponse<ReportePagosMensuales[]>> => {
    const supabase = await createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      }
    }

    // Verificar que el usuario sea DUENO o PLAYERO
    const esDueno = user.roles.includes(ROL.DUENO)
    const esPlayero = user.roles.includes(ROL.PLAYERO)

    if (!esDueno && !esPlayero) {
      return {
        data: null,
        error: 'No tienes permisos para acceder a los reportes'
      }
    }

    try {
      let query = supabase
        .from('reportes_pagos_mensuales')
        .select('*')
        .order('anio', { ascending: false })
        .order('mes', { ascending: false })
        .order('playa_nombre')
        .order('playero_nombre')

      // Si es playero, solo puede ver sus propios pagos
      if (esPlayero && !esDueno) {
        query = query.eq('playero_id', user.id)
      }

      // Aplicar filtros opcionales
      if (playaId) {
        query = query.eq('playa_id', playaId)
      }

      // Solo los dueños pueden filtrar por playero específico
      if (playeroId && esDueno) {
        query = query.eq('playero_id', playeroId)
      }

      if (anio) {
        query = query.eq('anio', anio)
      }

      if (mes) {
        query = query.eq('mes', mes)
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
            : 'Error desconocido al obtener el reporte de pagos mensuales'
      }
    }
  }
)
