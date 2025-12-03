import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

import type { AbonoDetalles } from './types'

export async function getAbonoById(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<ApiResponse<AbonoDetalles>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('abono')
    .select(
      `
      playa_id,
      plaza_id,
      fecha_hora_inicio,
      precio_mensual,
      estado,
      fecha_fin,
      playa:playa_id (
        nombre
      ),
      plaza:plaza!inner (
        identificador,
        tipo_plaza (
          nombre
        )
      ),
      abonado:abonado_id (
        abonado_id,
        nombre,
        apellido,
        dni,
        email,
        telefono,
        fecha_alta
      ),
      abono_vehiculo (
        vehiculo (
          patente,
          tipo_vehiculo
        )
      ),
      boleta (
        boleta_id,
        monto,
        monto_pagado,
        estado
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
      error: error.message
    }
  }

  if (!data) {
    return {
      data: null,
      error: 'Abono no encontrado'
    }
  }

  // Transform data
  const boletas = data.boleta || []
  const tieneDeuda = boletas.some(
    (b: any) => b.estado === 'PENDIENTE' || b.estado === 'VENCIDA'
  )

  const abono: AbonoDetalles = {
    playaId: data.playa_id,
    plazaId: data.plaza_id,
    fechaHoraInicio: new Date(data.fecha_hora_inicio),
    precioMensual: data.precio_mensual,
    estado: data.estado,
    fechaFin: data.fecha_fin ? new Date(data.fecha_fin) : null,
    playaNombre: (data.playa as any)?.nombre || '',
    plazaIdentificador: (data.plaza as any)?.identificador || '',
    tipoPlazaNombre: (data.plaza as any)?.tipo_plaza?.nombre || '',
    abonadoId: (data.abonado as any)?.abonado_id || 0,
    abonadoNombre: (data.abonado as any)?.nombre || '',
    abonadoApellido: (data.abonado as any)?.apellido || '',
    abonadoDni: (data.abonado as any)?.dni || '',
    abonadoEmail: (data.abonado as any)?.email || null,
    abonadoTelefono: (data.abonado as any)?.telefono || null,
    abonadoFechaAlta: new Date((data.abonado as any)?.fecha_alta),
    vehiculos:
      data.abono_vehiculo?.map((av: any) => ({
        patente: av.vehiculo?.patente || '',
        tipoVehiculo: av.vehiculo?.tipo_vehiculo || 'AUTOMOVIL'
      })) || [],
    tieneDeuda
  }

  return {
    data: abono,
    error: null
  }
}
