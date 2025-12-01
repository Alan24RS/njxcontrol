'use server'

import { revalidatePath } from 'next/cache'

import { type CreateAbonadoWithAbonoFormData } from '@/schemas/abonado'
import { updateAbonado, type UpdateAbonadoParams } from '@/services/abonados'
import { createAbono } from '@/services/abonos'
import { ApiResponse } from '@/types/api'

export async function createAbonadoWithAbonoCompleteAction(
  data: CreateAbonadoWithAbonoFormData
): Promise<ApiResponse<any>> {
  const result = await createAbono({
    nombre: data.abonado.nombre,
    apellido: data.abonado.apellido,
    email: data.abonado.email || undefined,
    telefono: data.abonado.telefono || undefined,
    dni: data.abonado.dni,
    playaId: data.abono.playa_id,
    plazaId: data.abono.plaza_id,
    fechaHoraInicio: data.abono.fecha_hora_inicio,
    vehiculos: data.abono.vehiculos.map((v) => ({
      patente: v.patente,
      tipoVehiculo: v.tipo_vehiculo
    }))
  })

  if (result.error) {
    return result
  }

  revalidatePath('/admin/abonados')
  revalidatePath('/admin/abonos')

  return result
}

export async function updateAbonadoAction(
  params: UpdateAbonadoParams
): Promise<ApiResponse<any>> {
  const result = await updateAbonado(params)

  if (result.error) {
    return result
  }

  revalidatePath('/admin/abonados')
  revalidatePath('/admin/abonos')

  return result
}
