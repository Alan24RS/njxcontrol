'use server'

import { createClient } from '@/lib/supabase/server'

import type { AbonoVigente, GetAbonosVigentesParams } from './types'

export async function getAbonosVigentes(
  params?: GetAbonosVigentesParams
): Promise<{
  data: AbonoVigente[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { playaId, sortBy = 'fecha_inicio', sortOrder = 'asc' } = params || {}

    const columnMap: Record<string, string> = {
      estado: 'estado',
      fecha_vencimiento: 'fecha_vencimiento',
      vencimiento: 'fecha_vencimiento',
      fecha_inicio: 'fecha_hora_inicio',
      cliente: 'cliente_apellido',
      apellido: 'cliente_apellido'
    }

    const dbColumn = columnMap[sortBy] || sortBy

    let query = supabase.from('v_abonos_vigentes').select('*')

    if (playaId) {
      query = query.eq('playa_id', playaId)
    }

    if (dbColumn) {
      query = query.order(dbColumn, {
        ascending: sortOrder === 'asc',
        nullsFirst: dbColumn === 'fecha_vencimiento' ? false : true
      })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error querying v_abonos_vigentes:', error)

      if (
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.code === '42P01'
      ) {
        return {
          data: null,
          error:
            'La vista v_abonos_vigentes no existe. Por favor, aplica la migración 20251201000000_create_v_abonos_vigentes_view.sql'
        }
      }

      return { data: null, error: error.message }
    }

    const abonos: AbonoVigente[] = await Promise.all(
      (data || []).map(async (abono: any) => {
        const { data: vehiculosData } = await supabase
          .from('abono_vehiculo')
          .select(
            `
            vehiculo:vehiculo!inner(patente, tipo_vehiculo)
          `
          )
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio', abono.fecha_hora_inicio)

        const { data: boletasData } = await supabase
          .from('v_boletas')
          .select('estado')
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)
          .eq('estado', 'VENCIDA')

        const tieneDeuda = (boletasData?.length || 0) > 0

        return {
          playaId: abono.playa_id,
          playaNombre: abono.playa_nombre || 'Sin nombre',
          plazaId: abono.plaza_id,
          fechaHoraInicio: new Date(abono.fecha_hora_inicio),
          fechaFin: abono.fecha_fin ? new Date(abono.fecha_fin) : null,
          fechaVencimiento: abono.fecha_vencimiento
            ? new Date(abono.fecha_vencimiento)
            : null,
          precioMensual: Number(abono.precio_mensual),
          estado: abono.estado,
          plazaIdentificador: abono.plaza_identificador,
          tipoPlazaNombre: abono.tipo_plaza_nombre,
          abonadoNombre: abono.abonado_nombre,
          abonadoApellido: abono.cliente_apellido,
          abonadoDni: abono.abonado_dni,
          vehiculos: (vehiculosData || []).map((av: any) => ({
            patente: av.vehiculo.patente,
            tipoVehiculo: av.vehiculo.tipo_vehiculo
          })),
          tieneDeuda: tieneDeuda
        }
      })
    )

    return { data: abonos, error: null }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Error al obtener abonos vigentes'
    }
  }
}
