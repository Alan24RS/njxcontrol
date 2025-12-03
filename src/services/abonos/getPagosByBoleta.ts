import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

interface Pago {
  pagoId: string
  numeroPago: number
  fechaHoraPago: Date
  montoPago: number
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO'
  playeroNombre: string
  playeroApellido: string
}

export async function getPagosByBoleta(
  boletaId: string
): Promise<ApiResponse<Pago[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pago')
    .select(
      `
      pago_id,
      numero_pago,
      fecha_hora_pago,
      monto_pago,
      metodo_pago,
      usuario:playero_id (
        nombre,
        apellido
      )
    `
    )
    .eq('boleta_id', boletaId)
    .order('fecha_hora_pago', { ascending: false })

  if (error) {
    return {
      data: null,
      error: error.message
    }
  }

  const pagos: Pago[] =
    data?.map((p: any) => ({
      pagoId: p.pago_id,
      numeroPago: p.numero_pago,
      fechaHoraPago: new Date(p.fecha_hora_pago),
      montoPago: p.monto_pago,
      metodoPago: p.metodo_pago,
      playeroNombre: p.usuario?.nombre || '',
      playeroApellido: p.usuario?.apellido || ''
    })) || []

  return {
    data: pagos,
    error: null
  }
}
