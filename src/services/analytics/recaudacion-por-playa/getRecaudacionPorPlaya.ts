import { createClient } from '@/lib/supabase/server'

import type {
  PagoDetalleRow,
  RecaudacionDiariaRow,
  RecaudacionPorPlayaFilters,
  RecaudacionPorPlayaResponse,
  RecaudacionPorPlayaRow
} from './types'

/**
 * Obtiene la recaudación mensual agrupada por playa y diaria por tipo
 * Consulta la tabla pago que contiene todos los ingresos (ocupaciones y abonos)
 */
export async function getRecaudacionPorPlaya(
  filters: RecaudacionPorPlayaFilters
): Promise<RecaudacionPorPlayaResponse> {
  const supabase = await createClient()

  // Query para obtener pagos con información de tipo
  let queryPagos = supabase
    .from('pago')
    .select(
      'pago_id, playa_id, fecha_hora_pago, monto_pago, ocupacion_id, boleta_id, playero_id'
    )
    .gte('fecha_hora_pago', filters.fecha_desde.toISOString())
    .lte('fecha_hora_pago', filters.fecha_hasta.toISOString())

  // Filtro opcional por playa
  if (filters.playa_id) {
    queryPagos = queryPagos.eq('playa_id', filters.playa_id)
  }

  const { data: pagosData, error } = await queryPagos

  if (error) {
    console.error('[getRecaudacionPorPlaya] Error:', error)
    throw new Error(`Error al obtener recaudación: ${error.message}`)
  }

  if (!pagosData || pagosData.length === 0) {
    return {
      data: [],
      dataDiaria: [],
      pagos: [],
      totales: {
        recaudacion_total: 0,
        recaudacion_abonos: 0,
        recaudacion_ocupaciones: 0,
        total_pagos: 0
      }
    }
  }

  // Obtener IDs únicos de playas
  const playaIds = [...new Set(pagosData.map((p) => p.playa_id))]

  // Consultar nombres de playas
  const { data: playasData, error: playasError } = await supabase
    .from('playa')
    .select('playa_id, nombre')
    .in('playa_id', playaIds)

  if (playasError) {
    console.error(
      '[getRecaudacionPorPlaya] Error al obtener playas:',
      playasError
    )
  }

  // Crear mapa de playa_id -> nombre
  const playaNombres = new Map<string, string>()
  playasData?.forEach((playa) => {
    playaNombres.set(playa.playa_id, playa.nombre)
  })

  // Obtener IDs únicos de playeros
  const playeroIds = [
    ...new Set(
      pagosData
        .map((p) => p.playero_id)
        .filter((id): id is string => typeof id === 'string' && !!id)
    )
  ]

  // Consultar nombres de playeros (vista v_playeros)
  let playerosNombres = new Map<string, string>()
  if (playeroIds.length > 0) {
    const { data: playerosData, error: playerosError } = await supabase
      .from('v_playeros')
      .select('playero_id, usuario_nombre')
      .in('playero_id', playeroIds)

    if (playerosError) {
      console.error(
        '[getRecaudacionPorPlaya] Error al obtener playeros:',
        playerosError
      )
    }

    playerosNombres = new Map<string, string>()
    playerosData?.forEach((pl) => {
      if (pl.playero_id) playerosNombres.set(pl.playero_id, pl.usuario_nombre)
    })
  }

  // Agrupar por playa y mes (para tabla)
  const grouped = new Map<string, RecaudacionPorPlayaRow>()

  // Agrupar por día (para gráfico)
  const groupedDiario = new Map<string, RecaudacionDiariaRow>()

  for (const pago of pagosData) {
    const mes = new Date(pago.fecha_hora_pago).toISOString().slice(0, 7) + '-01'
    const fecha = new Date(pago.fecha_hora_pago).toISOString().slice(0, 10)
    const keyMensual = `${pago.playa_id}_${mes}`
    const monto = Number(pago.monto_pago)

    // Determinar tipo de pago
    const esAbono = pago.boleta_id !== null
    const esOcupacion = pago.ocupacion_id !== null

    // Agrupación mensual por playa
    if (!grouped.has(keyMensual)) {
      const playaNombre = playaNombres.get(pago.playa_id) ?? 'Sin nombre'

      grouped.set(keyMensual, {
        playa_id: pago.playa_id,
        playa_nombre: playaNombre,
        mes,
        total_pagos: 0,
        recaudacion_mensual: 0,
        ticket_promedio: 0
      })
    }

    const row = grouped.get(keyMensual)!
    row.total_pagos += 1
    row.recaudacion_mensual += monto

    // Agrupación diaria por tipo
    if (!groupedDiario.has(fecha)) {
      groupedDiario.set(fecha, {
        fecha,
        recaudacion_total: 0,
        recaudacion_abonos: 0,
        recaudacion_ocupaciones: 0
      })
    }

    const rowDiaria = groupedDiario.get(fecha)!
    rowDiaria.recaudacion_total += monto

    if (esAbono) {
      rowDiaria.recaudacion_abonos += monto
    } else if (esOcupacion) {
      rowDiaria.recaudacion_ocupaciones += monto
    }
  }

  // Calcular ticket promedio por cada fila mensual
  const data = Array.from(grouped.values()).map((row) => ({
    ...row,
    ticket_promedio: row.recaudacion_mensual / row.total_pagos
  }))

  // Ordenar datos diarios por fecha
  const dataDiaria = Array.from(groupedDiario.values()).sort((a, b) =>
    a.fecha.localeCompare(b.fecha)
  )

  // Calcular totales globales
  const recaudacion_total = data.reduce(
    (sum, row) => sum + row.recaudacion_mensual,
    0
  )
  const total_pagos = data.reduce((sum, row) => sum + row.total_pagos, 0)

  const recaudacion_abonos = dataDiaria.reduce(
    (sum, row) => sum + row.recaudacion_abonos,
    0
  )
  const recaudacion_ocupaciones = dataDiaria.reduce(
    (sum, row) => sum + row.recaudacion_ocupaciones,
    0
  )

  // Construir detalle por pago para la tabla
  const pagos: PagoDetalleRow[] = pagosData
    .map((pago) => {
      const monto = Number(pago.monto_pago)
      const esAbono = pago.boleta_id !== null
      const esOcupacion = pago.ocupacion_id !== null

      const tipo: 'ABONO' | 'OCUPACION' | 'OTRO' = esAbono
        ? 'ABONO'
        : esOcupacion
          ? 'OCUPACION'
          : 'OTRO'

      const playaNombre = playaNombres.get(pago.playa_id) ?? 'Sin nombre'
      let playeroNombre: string | null = null
      if (pago.playero_id) {
        const found = playerosNombres.get(pago.playero_id)
        playeroNombre = found ?? null
      }

      return {
        pago_id: pago.pago_id,
        fecha: new Date(pago.fecha_hora_pago).toISOString(),
        playa_id: pago.playa_id,
        playa_nombre: playaNombre,
        playero_id: pago.playero_id ?? null,
        playero_nombre: playeroNombre,
        tipo,
        monto
      }
    })
    // Ordenar por fecha descendente para UX
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return {
    data,
    dataDiaria,
    pagos,
    totales: {
      recaudacion_total,
      recaudacion_abonos,
      recaudacion_ocupaciones,
      total_pagos
    }
  }
}
