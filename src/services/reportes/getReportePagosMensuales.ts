'use server'

import { cache } from 'react'

import { ROL } from '@/constants/rol'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ReportePagosMensuales } from '@/schemas/reportes'
import type { Turno } from '@/services/turnos'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

/**
 * Obtiene el reporte de pagos consolidados (ocupaciones + boletas) por mes
 * Accesible para DUENO (ve todas sus playas) y PLAYERO (ve solo sus propios pagos)
 *
 * Si el playero tiene un turno activo, se filtra automáticamente para mostrar
 * solo los pagos registrados en ese turno específico
 *
 * @param playaId - Opcional: filtrar por una playa específica
 * @param playeroId - Opcional: filtrar por un playero específico (solo para dueños)
 * @param anio - Opcional: filtrar por año
 * @param mes - Opcional: filtrar por mes (1-12)
 * @param turnoActivo - Opcional: turno activo del playero (solo para playeros)
 */
export const getReportePagosMensuales = cache(
  async (
    playaId?: string,
    playeroId?: string,
    anio?: number,
    mes?: number,
    turnoActivo?: Turno | null
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
      // Si es playero con turno activo, mostrar solo los pagos de ese turno
      if (esPlayero && !esDueno && turnoActivo) {
        // Consultar pagos directamente de la tabla pago filtrados por el turno activo
        const { data: pagosData, error: pagosError } = await supabase
          .from('pago')
          .select(
            `
            pago_id,
            playa_id,
            playero_id,
            fecha_hora_pago,
            monto_pago,
            metodo_pago,
            ocupacion_id,
            boleta_id,
            playa:playa_id (
              nombre,
              direccion
            ),
            usuario:playero_id (
              nombre
            )
          `
          )
          .eq('playa_id', turnoActivo.playaId)
          .eq('playero_id', user.id)
          .eq(
            'turno_fecha_hora_ingreso',
            turnoActivo.fechaHoraIngreso.toISOString()
          )

        if (pagosError) {
          return {
            data: null,
            error: translateDBError(pagosError.message)
          }
        }

        // Construir el reporte consolidado del turno activo
        if (!pagosData || pagosData.length === 0) {
          return {
            data: [],
            error: null
          }
        }

        const fechaTurno = turnoActivo.fechaHoraIngreso
        const pagosPorMetodo: Record<
          string,
          { efectivo: number; transferencia: number; mercado_pago: number }
        > = {
          ocupacion: { efectivo: 0, transferencia: 0, mercado_pago: 0 },
          boleta: { efectivo: 0, transferencia: 0, mercado_pago: 0 }
        }

        let recaudacionOcupaciones = 0
        let recaudacionBoletas = 0
        let cantidadPagosOcupaciones = 0
        let cantidadPagosBoletas = 0

        pagosData.forEach((pago: any) => {
          const tipoPago = pago.ocupacion_id ? 'ocupacion' : 'boleta'
          const monto = Number(pago.monto_pago)

          if (tipoPago === 'ocupacion') {
            recaudacionOcupaciones += monto
            cantidadPagosOcupaciones++
          } else {
            recaudacionBoletas += monto
            cantidadPagosBoletas++
          }

          // Acumular por método de pago
          const metodoKey =
            pago.metodo_pago.toLowerCase().replace(' ', '_') || 'efectivo'
          if (
            pagosPorMetodo[tipoPago][
              metodoKey as keyof typeof pagosPorMetodo.ocupacion
            ] !== undefined
          ) {
            pagosPorMetodo[tipoPago][
              metodoKey as keyof typeof pagosPorMetodo.ocupacion
            ] += monto
          }
        })

        // Construir array de pagos por método
        const pagosPorMetodoArray = []
        for (const [tipoPago, metodos] of Object.entries(pagosPorMetodo)) {
          for (const [metodo, monto] of Object.entries(metodos)) {
            if (monto > 0) {
              pagosPorMetodoArray.push({
                metodo_pago: metodo.toUpperCase().replace('_', ' '),
                monto,
                cantidad:
                  tipoPago === 'ocupacion'
                    ? cantidadPagosOcupaciones
                    : cantidadPagosBoletas,
                tipo_pago: tipoPago
              })
            }
          }
        }

        const reporteTurno: ReportePagosMensuales = {
          playa_id: turnoActivo.playaId,
          playa_nombre:
            (pagosData[0]?.playa as any)?.nombre || 'Playa desconocida',
          playa_direccion: (pagosData[0]?.playa as any)?.direccion || null,
          playero_id: user.id,
          playero_nombre:
            (pagosData[0]?.usuario as any)?.nombre || 'Playero desconocido',
          anio: fechaTurno.getFullYear(),
          mes: fechaTurno.getMonth() + 1,
          recaudacion_total: recaudacionOcupaciones + recaudacionBoletas,
          total_pagos: cantidadPagosOcupaciones + cantidadPagosBoletas,
          recaudacion_ocupaciones: recaudacionOcupaciones,
          recaudacion_boletas: recaudacionBoletas,
          cantidad_pagos_ocupaciones: cantidadPagosOcupaciones,
          cantidad_pagos_boletas: cantidadPagosBoletas,
          pagos_por_metodo: pagosPorMetodoArray
        }

        return {
          data: [reporteTurno],
          error: null
        }
      }

      // Lógica original para reportes mensuales (dueños o playeros sin turno activo)
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
