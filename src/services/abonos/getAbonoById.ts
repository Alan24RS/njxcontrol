'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import type { AbonoDetails } from './types'

export async function getAbonoById(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<ApiResponse<AbonoDetails | null>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('abono')
      .select(
        `
        *,
        plaza:plaza!inner(identificador, tipo_plaza:tipo_plaza!plaza_tipo_plaza_fkey(nombre)),
        abonado:abonado!inner(nombre, apellido, dni),
        abono_vehiculo:abono_vehiculo(
          vehiculo:vehiculo!inner(patente, tipo_vehiculo)
        )
      `
      )
      .eq('playa_id', playaId)
      .eq('plaza_id', plazaId)
      .eq('fecha_hora_inicio', fechaHoraInicio)
      .single()

    if (error) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'Abono no encontrado'
      }
    }

    const { data: boletasData } = await supabase
      .from('boleta')
      .select('monto_pagado')
      .eq('playa_id', playaId)
      .eq('plaza_id', plazaId)
      .eq('fecha_hora_inicio_abono', fechaHoraInicio)

    const totalPagado =
      boletasData?.reduce(
        (sum, boleta) => sum + Number(boleta.monto_pagado || 0),
        0
      ) || 0

    const mesesCompletos =
      data.fecha_fin && data.fecha_hora_inicio
        ? Math.max(
            0,
            Math.floor(
              (new Date(data.fecha_fin).getTime() -
                new Date(data.fecha_hora_inicio).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            )
          )
        : 0

    const montoTotal = mesesCompletos * Number(data.precio_mensual || 0)
    const saldoPendiente = montoTotal - totalPagado

    const abonoDetails: AbonoDetails = {
      playaId: data.playa_id,
      plazaId: data.plaza_id,
      fechaHoraInicio: new Date(data.fecha_hora_inicio),
      fechaFin: data.fecha_fin ? new Date(data.fecha_fin) : null,
      precioMensual: Number(data.precio_mensual),
      estado: data.estado,
      plazaIdentificador: data.plaza.identificador,
      tipoPlazaNombre: data.plaza.tipo_plaza.nombre,
      abonadoNombre: data.abonado.nombre,
      abonadoApellido: data.abonado.apellido,
      abonadoDni: data.abonado.dni,
      vehiculos: (data.abono_vehiculo || []).map((av: any) => ({
        patente: av.vehiculo.patente,
        tipoVehiculo: av.vehiculo.tipo_vehiculo
      })),
      totalPagado,
      saldoPendiente,
      observaciones: data.observaciones || null
    }

    return {
      data: abonoDetails,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al obtener el abono'
    }
  }
}
