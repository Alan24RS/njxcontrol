'use server'

import { createClient } from '@/lib/supabase/server'

import type { DeudaPorPatente } from './types'

export async function verificarDeudaPorPatente(
  patente: string,
  playaId: string
): Promise<{
  data: DeudaPorPatente | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data: vehiculoData, error: vehiculoError } = await supabase
      .from('abono_vehiculo')
      .select(
        `
        abono:abono!inner(
          abonado_id,
          playa_id,
          plaza_id,
          fecha_hora_inicio,
          estado,
          abonado:abonado!inner(nombre, apellido)
        )
      `
      )
      .eq('patente', patente)
      .eq('abono.playa_id', playaId)
      .eq('abono.estado', 'ACTIVO')
      .single()

    if (vehiculoError || !vehiculoData) {
      return {
        data: {
          tieneAbono: false,
          tieneDeuda: false,
          abonadoNombre: '',
          abonadoApellido: '',
          abonadoId: 0,
          deudaTotal: 0,
          boletasVencidas: 0
        },
        error: null
      }
    }

    const abono = vehiculoData.abono[0]

    if (!abono) {
      return {
        data: {
          tieneAbono: false,
          tieneDeuda: false,
          abonadoNombre: '',
          abonadoApellido: '',
          abonadoId: 0,
          deudaTotal: 0,
          boletasVencidas: 0
        },
        error: null
      }
    }

    const { data: boletasData, error: boletasError } = await supabase
      .from('v_boletas')
      .select('*')
      .eq('playa_id', abono.playa_id)
      .eq('plaza_id', abono.plaza_id)
      .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)
      .eq('estado', 'VENCIDA')

    if (boletasError) {
      return { data: null, error: boletasError.message }
    }

    const tieneDeuda = (boletasData || []).length > 0
    const deudaTotal = (boletasData || []).reduce(
      (sum: number, boleta: any) => {
        return sum + (Number(boleta.monto) - Number(boleta.monto_pagado || 0))
      },
      0
    )

    const abonadoInfo = Array.isArray(abono.abonado)
      ? abono.abonado[0]
      : abono.abonado

    return {
      data: {
        tieneAbono: true,
        tieneDeuda: tieneDeuda,
        abonadoNombre: abonadoInfo?.nombre || '',
        abonadoApellido: abonadoInfo?.apellido || '',
        abonadoId: abono.abonado_id || 0,
        deudaTotal: deudaTotal,
        boletasVencidas: (boletasData || []).length
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Error al verificar deuda por patente'
    }
  }
}
