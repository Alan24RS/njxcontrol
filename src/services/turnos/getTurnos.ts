'use server'
import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SELECT, RawTurno, type Turno } from '@/services/turnos/types'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'

import { getTurnoFilters } from './getTurnoFilters'
import { transformListTurno } from './transformers'

// Obtener todos los turnos de un playero (o de una playa)
export const getTurnos = cache(
  async (params?: {
    playaId?: string | string[] | undefined
    fromDate?: string | undefined
    toDate?: string | undefined
    includeFilters?: boolean
  }): Promise<ApiResponse<Turno[]>> => {
    const supabase = await createClient()

    let query = supabase.from('turno').select(DEFAULT_SELECT)

    // Filtrar por playa(s)
    if (params?.playaId) {
      if (Array.isArray(params.playaId)) {
        query = query.in('playa_id', params.playaId)
      } else {
        query = query.eq('playa_id', params.playaId)
      }
    }

    if (params?.fromDate) {
      // assume fromDate is ISO date (YYYY-MM-DD)
      query = query.gte('fecha_hora_ingreso', params.fromDate)
    }

    if (params?.toDate) {
      // include end of day for toDate
      const to = params.toDate
      query = query.lte('fecha_hora_ingreso', `${to}T23:59:59`)
    }

    // ordenar por fecha de ingreso descendente
    query = query.order('fecha_hora_ingreso', { ascending: false })

    const { data, error } = await query

    if (error || !data) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    // Obtener información de las playas
    const playaIds = [...new Set(data.map((t) => t.playa_id))]
    const { data: playasData } = await supabase
      .from('playa')
      .select('playa_id, nombre, direccion')
      .in('playa_id', playaIds)

    // Crear un mapa de playas para fácil acceso
    const playasMap = new Map(playasData?.map((p) => [p.playa_id, p]) || [])

    // Transformar turnos y agregar información de playa
    const transformedData = transformListTurno(data as unknown as RawTurno[])
    const dataWithPlayas = transformedData.map((turno) => ({
      ...turno,
      playaNombre: playasMap.get(turno.playaId)?.nombre || undefined,
      playaDireccion: playasMap.get(turno.playaId)?.direccion || undefined
    }))

    // Obtener filtros si se solicita
    let filters = undefined
    if (params?.includeFilters && params?.playaId) {
      const appliedFilters = extractAppliedFilters(params)
      // Usar el primer playaId si es un array, o el playaId si es string
      const playaIdForFilters: string = Array.isArray(params.playaId)
        ? params.playaId[0] || ''
        : params.playaId
      const filtersResponse = await getTurnoFilters({
        playaId: playaIdForFilters,
        appliedFilters
      })
      filters = filtersResponse.data || undefined
    }

    return {
      data: dataWithPlayas,
      error: null,
      filters
    }
  }
)
