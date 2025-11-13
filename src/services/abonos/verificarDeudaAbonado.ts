'use server'

import { createClient } from '@/lib/supabase/server'

import { transformListDeudaBoleta } from './transformers'
import type { DeudaAbonado, RawDeudaBoleta } from './types'

export async function verificarDeudaAbonado(abonadoId: number): Promise<{
  data: DeudaAbonado | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data: abonosData, error: abonosError } = await supabase
      .from('abono')
      .select('playa_id, plaza_id, fecha_hora_inicio')
      .eq('abonado_id', abonadoId)
      .eq('estado', 'ACTIVO')

    if (abonosError) {
      return { data: null, error: abonosError.message }
    }

    if (!abonosData || abonosData.length === 0) {
      return {
        data: {
          tieneDeuda: false,
          deudaTotal: 0,
          boletasVencidas: 0,
          boletasPendientes: []
        },
        error: null
      }
    }

    let deudaTotal = 0
    let boletasVencidas = 0
    const rawBoletasPendientes: RawDeudaBoleta[] = []

    for (const abono of abonosData) {
      const { data: boletasData, error: boletasError } = await supabase
        .from('v_boletas')
        .select('*')
        .eq('playa_id', abono.playa_id)
        .eq('plaza_id', abono.plaza_id)
        .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)
        .eq('estado', 'VENCIDA')

      if (boletasError) continue

      if (boletasData && boletasData.length > 0) {
        boletasVencidas += boletasData.length

        boletasData.forEach((boleta: any) => {
          const deudaPendiente =
            Number(boleta.monto) - Number(boleta.monto_pagado || 0)
          deudaTotal += deudaPendiente

          rawBoletasPendientes.push({
            fecha_generacion_boleta: boleta.fecha_generacion_boleta,
            fecha_vencimiento_boleta: boleta.fecha_vencimiento_boleta,
            monto: Number(boleta.monto),
            monto_pagado: Number(boleta.monto_pagado || 0)
          })
        })
      }
    }

    return {
      data: {
        tieneDeuda: deudaTotal > 0,
        deudaTotal,
        boletasVencidas,
        boletasPendientes: transformListDeudaBoleta(rawBoletasPendientes)
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Error al verificar deuda del abonado'
    }
  }
}
