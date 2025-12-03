'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListAbonado } from './transformers'
import type { Abonado, GetAbonadosParams, RawAbonado } from './types'

const sortColumnMap: Record<string, string> = {
  fechaAlta: 'fecha_alta',
  nombre: 'nombre',
  apellido: 'apellido',
  email: 'email',
  dni: 'dni',
  estado: 'estado'
}

export const getAbonados = async (
  params: GetAbonadosParams = {}
): Promise<ApiResponse<Abonado[]>> => {
  const supabase = await createClient()

  const {
    page = 1,
    limit = 10,
    query = '',
    fromDate,
    toDate,
    estado = [],
    playaId
  } = params

  const sortByRaw = Array.isArray(params.sortBy)
    ? params.sortBy[0]
    : params.sortBy || 'fechaAlta'

  let order: 'asc' | 'desc' = 'desc'
  if (params.order) {
    if (Array.isArray(params.order) && params.order[0]) {
      const orderValue = params.order[0]
      if (orderValue === 'asc' || orderValue === 'desc') {
        order = orderValue
      }
    } else if (typeof params.order === 'string') {
      if (params.order === 'asc' || params.order === 'desc') {
        order = params.order
      }
    }
  }

  let sortBy: string = 'fechaAlta'

  if (typeof sortByRaw === 'string') {
    if (sortByRaw.includes(' ')) {
      const parts = sortByRaw.trim().split(/\s+/)
      sortBy = parts[0]
      if (parts.length > 1 && (parts[1] === 'asc' || parts[1] === 'desc')) {
        order = parts[1] as 'asc' | 'desc'
      }
    } else {
      sortBy = sortByRaw
    }
  }

  const dbSortColumn = sortColumnMap[sortBy] || 'fecha_alta'

  let abonadoIds: number[] = []
  if (playaId) {
    const { data: abonosData, error: abonosError } = await supabase
      .from('abono')
      .select('abonado_id')
      .eq('playa_id', playaId)

    if (abonosError) {
      return { data: null, error: translateDBError(abonosError.message) }
    }

    abonadoIds = [...new Set(abonosData?.map((a) => a.abonado_id) || [])]
  }

  let queryBuilder = supabase.from('abonado').select('*', { count: 'exact' })

  if (playaId && abonadoIds.length > 0) {
    queryBuilder = queryBuilder.in('abonado_id', abonadoIds)
  } else if (playaId && abonadoIds.length === 0) {
    return {
      data: [],
      error: null,
      pagination: {
        currentPage: page,
        lastPage: 1,
        total: 0,
        pageSize: limit
      }
    }
  }

  if (query && query.trim()) {
    const normalized = query.trim().toLowerCase()
    queryBuilder = queryBuilder.or(
      `dni.ilike.%${normalized}%,nombre.ilike.%${normalized}%,apellido.ilike.%${normalized}%`
    )
  }

  if (fromDate) queryBuilder = queryBuilder.gte('fecha_alta', fromDate)
  if (toDate) queryBuilder = queryBuilder.lte('fecha_alta', toDate)

  if (estado && estado.length > 0) {
    queryBuilder = queryBuilder.in('estado', estado)
  }

  if (dbSortColumn) {
    queryBuilder = queryBuilder.order(dbSortColumn, {
      ascending: order === 'asc'
    })
  }

  const start = (page - 1) * limit
  const end = start + limit - 1
  queryBuilder = queryBuilder.range(start, end)

  const { data, error, count } = await queryBuilder

  if (error) {
    return { data: null, error: translateDBError(error.message) }
  }

  const pagination = {
    currentPage: page,
    lastPage: count ? Math.ceil(count / limit) : 1,
    total: count ?? 0,
    pageSize: limit
  }

  return {
    data: transformListAbonado(data as RawAbonado[]),
    error: null,
    pagination
  }
}
