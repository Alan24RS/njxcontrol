import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getOcupacionFilters } from './getOcupacionFilters'
import { transformListOcupacionVista } from './transformers'
import type { GetOcupacionesParams, OcupacionConRelaciones } from './types'

// Mapeo de columnas del frontend a campos de la vista
// IMPORTANTE: estado_ocupacion mapea a 'ocupacion_estado' (campo calculado) no a 'estado'
const OCUPACION_COLUMN_MAPPING = createColumnMapping({
  patente: 'patente',
  tipo_vehiculo: 'tipo_vehiculo',
  modalidad_ocupacion: 'modalidad_ocupacion',
  plaza: 'plaza_identificador',
  hora_ingreso: 'hora_ingreso',
  duracion_minutos: 'duracion_minutos',
  estado_ocupacion: 'ocupacion_estado',
  plaza_estado: 'plaza_estado'
} as const)

export const getOcupaciones = cache(
  async (
    params: GetOcupacionesParams
  ): Promise<ApiResponse<OcupacionConRelaciones[]>> => {
    try {
      const supabase = await createClient()
      const {
        playaId,
        estado,
        page = 1,
        limit = 10,
        sortBy,
        playeroId,
        tipoVehiculo,
        modalidadOcupacion,
        fromDate,
        toDate,
        includeFilters
      } = params

      // Validar parámetros obligatorios
      if (!playaId) {
        return {
          data: null,
          error: 'El ID de la playa es requerido'
        }
      }

      // Construir query desde la vista v_ocupaciones
      let query = supabase
        .from('v_ocupaciones')
        .select('*', { count: 'exact' })
        .eq('playa_id', playaId)

      // Filtrar por estado(s) si se proporciona
      // IMPORTANTE: Usar 'ocupacion_estado' (campo calculado) en lugar de 'estado' (campo de tabla)
      if (estado) {
        if (Array.isArray(estado)) {
          query = query.in('ocupacion_estado', estado)
        } else {
          query = query.eq('ocupacion_estado', estado)
        }
      }

      // Filtrar por playero(s) - busca tanto en playero que abre como en playero que cierra
      if (playeroId) {
        const playeroIds = Array.isArray(playeroId) ? playeroId : [playeroId]
        const playeroIdsStr = playeroIds.join(',')
        query = query.or(
          `playero_id.in.(${playeroIdsStr}),playero_cierre_id.in.(${playeroIdsStr})`
        )
      }

      // Filtrar por tipo(s) de vehículo
      if (tipoVehiculo) {
        if (Array.isArray(tipoVehiculo)) {
          query = query.in('tipo_vehiculo', tipoVehiculo)
        } else {
          query = query.eq('tipo_vehiculo', tipoVehiculo)
        }
      }

      // Filtrar por modalidad(es) de ocupación
      if (modalidadOcupacion) {
        if (Array.isArray(modalidadOcupacion)) {
          query = query.in('modalidad_ocupacion', modalidadOcupacion)
        } else {
          query = query.eq('modalidad_ocupacion', modalidadOcupacion)
        }
      }

      // Filtrar por rango de fechas (hora_ingreso)
      if (fromDate) {
        query = query.gte('hora_ingreso', `${fromDate}T00:00:00`)
      }

      if (toDate) {
        query = query.lte('hora_ingreso', `${toDate}T23:59:59`)
      }

      // Aplicar ordenamiento usando la utilidad compartida
      query = applySorting(query, {
        sortBy,
        columnMapping: OCUPACION_COLUMN_MAPPING,
        defaultSort: {
          column: 'hora_ingreso',
          direction: 'desc'
        }
      })

      // Paginación
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        return {
          data: null,
          error: 'Error al obtener las ocupaciones'
        }
      }

      const transformedData = transformListOcupacionVista(data)

      // Obtener filtros si se solicita
      let filters = undefined
      if (includeFilters) {
        const appliedFilters = extractAppliedFilters(params)
        const filtersResponse = await getOcupacionFilters({
          playaId,
          appliedFilters
        })
        filters = filtersResponse.data || undefined
      }

      return {
        data: transformedData,
        error: null,
        pagination: count
          ? {
              currentPage: page,
              lastPage: Math.ceil(count / limit),
              total: count,
              pageSize: limit
            }
          : undefined,
        filters
      }
    } catch {
      return {
        data: null,
        error: 'Error al obtener las ocupaciones'
      }
    }
  }
)
