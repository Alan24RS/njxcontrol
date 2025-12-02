'use server'

import { createClient } from '@/lib/supabase/server'

import type { AbonoVigente } from './types'

export async function getAbonosVigentes(playaId?: string): Promise<{
  data: AbonoVigente[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('abono')
      .select(
        `
        *,
        playa:playa!inner(nombre),
        plaza:plaza!inner(identificador, tipo_plaza:tipo_plaza!plaza_tipo_plaza_fkey(nombre)),
        abonado:abonado!inner(nombre, apellido, dni),
        abono_vehiculo:abono_vehiculo!inner(
          vehiculo:vehiculo!inner(patente, tipo_vehiculo)
        )
      `
      )
      .eq('estado', 'ACTIVO')
      .is('fecha_fin', null)

    if (playaId) {
      query = query.eq('playa_id', playaId)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    const abonos: AbonoVigente[] = await Promise.all(
      (data || []).map(async (abono: any) => {
        const { data: boletasData } = await supabase
          .from('v_boletas')
          .select('estado')
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)
          .in('estado', ['PENDIENTE', 'VENCIDA'])

        const tieneDeuda = (boletasData?.length || 0) > 0

        // Calcular precio_mensual si no está disponible
        let precioMensual = Number(abono.precio_mensual) || 0

        if (!precioMensual || precioMensual === 0) {
          // Obtener tipo_plaza_id de la plaza
          const { data: plazaData } = await supabase
            .from('plaza')
            .select('tipo_plaza_id')
            .eq('plaza_id', abono.plaza_id)
            .single()

          if (plazaData) {
            // Preparar vehiculos para la función
            const vehiculos = abono.abono_vehiculo.map((av: any) => ({
              tipo_vehiculo: av.vehiculo.tipo_vehiculo
            }))

            // Llamar a la función de cálculo de tarifa
            const { data: tarifaData } = await supabase.rpc(
              'get_max_tarifa_abono_vehiculos',
              {
                p_playa_id: abono.playa_id,
                p_tipo_plaza_id: plazaData.tipo_plaza_id,
                p_vehiculos: vehiculos
              }
            )

            if (tarifaData) {
              precioMensual = Number(tarifaData)
            }
          }
        }

        return {
          playaId: abono.playa_id,
          playaNombre: abono.playa?.nombre || 'Sin nombre',
          plazaId: abono.plaza_id,
          fechaHoraInicio: new Date(abono.fecha_hora_inicio),
          precioMensual,
          estado: abono.estado,
          plazaIdentificador: abono.plaza.identificador,
          tipoPlazaNombre: abono.plaza.tipo_plaza.nombre,
          abonadoNombre: abono.abonado.nombre,
          abonadoApellido: abono.abonado.apellido,
          abonadoDni: abono.abonado.dni,
          vehiculos: abono.abono_vehiculo.map((av: any) => ({
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
