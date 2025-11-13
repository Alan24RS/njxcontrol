'use server'

import { createClient } from '@/lib/supabase/server'
import { getUnavailablePlazaIds } from '@/services/plazas/helpers'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getTipoPlazaFilters } from './getTipoPlazaFilters'
import { transformListTipoPlaza } from './transformers'
import type {
  GetTiposPlazaParams,
  RawTipoPlazaWithCaracteristicas,
  TipoPlaza
} from './types'

const TIPO_PLAZA_COLUMN_MAPPING = createColumnMapping({
  nombre: 'nombre',
  descripcion: 'descripcion',
  fechaCreacion: 'fecha_creacion'
} as const)

export async function getTiposPlaza(
  args: GetTiposPlazaParams
): Promise<ApiResponse<TipoPlaza[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const {
    playaId,
    sortBy,
    query: searchQuery,
    caracteristicas,
    includeFilters,
    includeAvailability,
    tiposVehiculo,
    onlyAvailable
  } = args

  let filters = null
  if (includeFilters) {
    const filtersResponse = await getTipoPlazaFilters({
      query: searchQuery,
      caracteristicas,
      playaId
    })
    filters = filtersResponse.data
  }

  let query = supabase
    .from('tipo_plaza')
    .select(
      `
      tipo_plaza_id,
      playa_id,
      nombre,
      descripcion,
      fecha_creacion,
      fecha_modificacion,
      fecha_eliminacion,
      playa:playa_id!inner(playa_dueno_id),
      tipo_plaza_caracteristica(
        caracteristica(
          caracteristica_id,
          nombre,
          fecha_creacion,
          fecha_modificacion
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('playa_id', playaId)
    .is('fecha_eliminacion', null)

  // Aplicar filtro de búsqueda por nombre o descripción
  if (searchQuery) {
    // Usar la sintaxis que funciona en plazas
    query = query.or(
      `nombre.ilike.*${searchQuery}*,descripcion.ilike.*${searchQuery}*`
    )
  }

  // Aplicar filtro por características
  if (caracteristicas && caracteristicas.length > 0) {
    // Obtener los IDs de tipos de plaza que tienen las características seleccionadas
    const { data: tipoPlazaIds } = await supabase
      .from('tipo_plaza_caracteristica')
      .select('tipo_plaza_id')
      .in('caracteristica_id', caracteristicas)

    if (tipoPlazaIds && tipoPlazaIds.length > 0) {
      const ids = tipoPlazaIds.map((item) => item.tipo_plaza_id)
      query = query.in('tipo_plaza_id', ids)
    } else {
      // Si no hay resultados, devolver array vacío
      return {
        data: [],
        error: null,
        pagination: {
          total: 0,
          lastPage: 1,
          currentPage: page
        },
        filters: filters || undefined
      }
    }
  }

  query = applySorting(query, {
    sortBy,
    columnMapping: TIPO_PLAZA_COLUMN_MAPPING,
    defaultSort: {
      column: 'fecha_creacion',
      direction: 'desc'
    }
  })

  query = query.range(skip, skip + limit - 1)

  const { data, error, count } = await query.overrideTypes<
    (RawTipoPlazaWithCaracteristicas & {
      playa: { playa_dueno_id: string }
    })[],
    { merge: false }
  >()

  // Transformar los datos removiendo el campo playa del resultado
  const rawTiposPlaza: RawTipoPlazaWithCaracteristicas[] | null = data
    ? data.map(({ playa: _playa, ...tipoPlaza }) => tipoPlaza)
    : null

  let tiposPlazaTransformados = transformListTipoPlaza(rawTiposPlaza)

  if (includeAvailability && playaId && tiposPlazaTransformados) {
    const unavailableResult = await getUnavailablePlazaIds(playaId)
    if (unavailableResult.error) {
      return {
        data: null,
        error: unavailableResult.error
      }
    }

    const plazasNoDisponiblesIds = new Set(unavailableResult.data || [])

    const { data: allPlazasData } = await supabase
      .from('plaza')
      .select('plaza_id, tipo_plaza_id')
      .eq('playa_id', playaId)
      .eq('estado', 'ACTIVO')

    const plazasDisponiblesPorTipo = (allPlazasData || []).reduce(
      (acc, plaza) => {
        if (!plazasNoDisponiblesIds.has(plaza.plaza_id)) {
          acc[plaza.tipo_plaza_id] = (acc[plaza.tipo_plaza_id] || 0) + 1
        }
        return acc
      },
      {} as Record<number, number>
    )

    tiposPlazaTransformados = await Promise.all(
      tiposPlazaTransformados.map(async (tipoPlaza) => {
        const plazasDisponibles = plazasDisponiblesPorTipo[tipoPlaza.id] || 0

        let tarifaMaxima: number | null = null

        if (tiposVehiculo && tiposVehiculo.length > 0) {
          for (const tipoVehiculo of tiposVehiculo) {
            const { data: tarifaData } = await supabase
              .from('tarifa')
              .select('precio_base')
              .eq('playa_id', playaId)
              .eq('tipo_plaza_id', tipoPlaza.id)
              .eq('modalidad_ocupacion', 'ABONO')
              .eq('tipo_vehiculo', tipoVehiculo)
              .maybeSingle()

            if (tarifaData) {
              if (
                tarifaMaxima === null ||
                tarifaData.precio_base > tarifaMaxima
              ) {
                tarifaMaxima = tarifaData.precio_base
              }
            }
          }
        }

        return {
          ...tipoPlaza,
          plazasDisponibles,
          tarifaMaxima
        }
      })
    )

    if (onlyAvailable) {
      tiposPlazaTransformados = tiposPlazaTransformados.filter(
        (t) => (t.plazasDisponibles || 0) > 0
      )
    }
  }

  const total = typeof count === 'number' ? count : 0
  const currentPageSize = limit
  const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

  return {
    data: tiposPlazaTransformados,
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    },
    filters: filters || undefined
  }
}
