'use server'

import { cache } from 'react'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { Turno } from '@/services/turnos'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export interface PagoPorMetodoTurno {
  metodo_pago: string
  monto: number
  cantidad: number
  tipo_pago: 'ocupacion' | 'boleta'
}

export interface ReporteTurnoActual {
  turno: Turno
  recaudacion_total: number
  total_pagos: number
  recaudacion_ocupaciones: number
  recaudacion_boletas: number
  cantidad_pagos_ocupaciones: number
  cantidad_pagos_boletas: number
  pagos_por_metodo: PagoPorMetodoTurno[]
}

/**
 * Obtiene el reporte detallado del turno activo del playero
 * Consulta directamente los pagos asociados al turno
 */
export const getReporteTurnoActual = cache(
  async (turno: Turno): Promise<ApiResponse<ReporteTurnoActual>> => {
    const supabase = await createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      }
    }

    try {
      // Consultar pagos del turno activo
      const { data: pagosData, error: pagosError } = await supabase
        .from('pago')
        .select(
          `
          pago_id,
          monto_pago,
          metodo_pago,
          ocupacion_id,
          boleta_id
        `
        )
        .eq('playa_id', turno.playaId)
        .eq('playero_id', user.id)
        .eq('turno_fecha_hora_ingreso', turno.fechaHoraIngreso.toISOString())

      if (pagosError) {
        return {
          data: null,
          error: translateDBError(pagosError.message)
        }
      }

      // Si no hay pagos, retornar reporte vacío
      if (!pagosData || pagosData.length === 0) {
        return {
          data: {
            turno,
            recaudacion_total: 0,
            total_pagos: 0,
            recaudacion_ocupaciones: 0,
            recaudacion_boletas: 0,
            cantidad_pagos_ocupaciones: 0,
            cantidad_pagos_boletas: 0,
            pagos_por_metodo: []
          },
          error: null
        }
      }

      // Procesar los pagos
      const pagosPorMetodoMap = new Map<string, PagoPorMetodoTurno>()
      let recaudacionOcupaciones = 0
      let recaudacionBoletas = 0
      let cantidadPagosOcupaciones = 0
      let cantidadPagosBoletas = 0

      pagosData.forEach((pago: any) => {
        const tipoPago = pago.ocupacion_id ? 'ocupacion' : 'boleta'
        const monto = Number(pago.monto_pago)
        const metodo = pago.metodo_pago as string

        // Acumular por tipo de pago
        if (tipoPago === 'ocupacion') {
          recaudacionOcupaciones += monto
          cantidadPagosOcupaciones++
        } else {
          recaudacionBoletas += monto
          cantidadPagosBoletas++
        }

        // Acumular por método de pago
        const key = `${metodo}-${tipoPago}`
        const existing = pagosPorMetodoMap.get(key)

        if (existing) {
          existing.monto += monto
          existing.cantidad++
        } else {
          pagosPorMetodoMap.set(key, {
            metodo_pago: metodo,
            monto,
            cantidad: 1,
            tipo_pago: tipoPago
          })
        }
      })

      const reporte: ReporteTurnoActual = {
        turno,
        recaudacion_total: recaudacionOcupaciones + recaudacionBoletas,
        total_pagos: cantidadPagosOcupaciones + cantidadPagosBoletas,
        recaudacion_ocupaciones: recaudacionOcupaciones,
        recaudacion_boletas: recaudacionBoletas,
        cantidad_pagos_ocupaciones: cantidadPagosOcupaciones,
        cantidad_pagos_boletas: cantidadPagosBoletas,
        pagos_por_metodo: Array.from(pagosPorMetodoMap.values()).sort(
          (a, b) => b.monto - a.monto
        )
      }

      return {
        data: reporte,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al obtener el reporte del turno'
      }
    }
  }
)
