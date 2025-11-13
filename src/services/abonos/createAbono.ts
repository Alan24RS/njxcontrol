'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import type { CreateAbonoParams, CreateAbonoResponse } from './types'

export async function createAbono(
  params: CreateAbonoParams
): Promise<ApiResponse<CreateAbonoResponse>> {
  try {
    const supabase = await createClient()

    const vehiculosJSON = params.vehiculos.map((v) => ({
      patente: v.patente.toUpperCase(),
      tipo_vehiculo: v.tipoVehiculo
    }))

    const rpcParams: Record<string, any> = {
      p_nombre: params.nombre,
      p_apellido: params.apellido,
      p_email: params.email || null,
      p_telefono: params.telefono || null,
      p_dni: params.dni,
      p_playa_id: params.playaId,
      p_plaza_id: params.plazaId,
      p_fecha_hora_inicio:
        params.fechaHoraInicio instanceof Date
          ? params.fechaHoraInicio.toISOString()
          : params.fechaHoraInicio,
      p_vehiculos: vehiculosJSON
    }

    if (params.turnoPlayaId) {
      rpcParams.p_turno_playa_id = params.turnoPlayaId
    }
    if (params.turnoPlayeroId) {
      rpcParams.p_turno_playero_id = params.turnoPlayeroId
    }
    if (params.turnoFechaHoraIngreso) {
      rpcParams.p_turno_fecha_hora_ingreso =
        params.turnoFechaHoraIngreso instanceof Date
          ? params.turnoFechaHoraIngreso.toISOString()
          : params.turnoFechaHoraIngreso
    }
    if (params.metodoPago) {
      rpcParams.p_metodo_pago = params.metodoPago
    }
    if (params.montoPago !== undefined) {
      rpcParams.p_monto_pago = params.montoPago
    }

    const { data, error } = await supabase.rpc(
      'create_abonado_with_abono',
      rpcParams
    )

    if (error) {
      console.error('RPC error:', error)
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    if (!data || !data.abonado || !data.abono) {
      return {
        data: null,
        error: 'Error al crear el abono: respuesta inválida del servidor'
      }
    }

    return {
      data: {
        abonadoId: data.abonado.abonado_id,
        abonadoNombre: data.abonado.nombre,
        abonadoApellido: data.abonado.apellido,
        abonadoEmail: data.abonado.email,
        abonadoTelefono: data.abonado.telefono,
        abonadoDni: data.abonado.dni,
        abonadoFechaAlta: data.abonado.fecha_alta,
        abonadoYaExistia: data.abonado.ya_existia,
        abonoPlayaId: data.abono.playa_id,
        abonoPlazaId: data.abono.plaza_id,
        abonoFechaHoraInicio: data.abono.fecha_hora_inicio,
        abonoFechaFin: data.abono.fecha_fin,
        abonoPrecioMensual: data.abono.precio_mensual,
        abonoEstado: data.abono.estado,
        vehiculos: data.vehiculos || [],
        boletaInicial: data.boleta_inicial
          ? {
              fechaGeneracion: data.boleta_inicial.fecha_generacion,
              fechaVencimiento: data.boleta_inicial.fecha_vencimiento,
              monto: data.boleta_inicial.monto
            }
          : undefined
      },
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error al crear abono'
    }
  }
}
