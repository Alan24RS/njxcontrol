'use server'

import { revalidatePath } from 'next/cache'

import {
  createOcupacionSchema,
  finalizarOcupacionSchema,
  updateMetodoPagoSchema,
  updateOcupacionSchema
} from '@/schemas/ocupacion'
import { createOcupacion } from '@/services/ocupaciones/createOcupacion'
import { finalizarOcupacion } from '@/services/ocupaciones/finalizarOcupacion'
import { updateOcupacion } from '@/services/ocupaciones/updateOcupacion'
import { updateMetodoPagoOcupacion } from '@/services/pagos'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function createOcupacionAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(payload)

  // Convertir numeroPago a número si existe
  const dataToValidate = {
    ...formData,
    numeroPago: formData.numeroPago ? Number(formData.numeroPago) : undefined
  }

  const parsed = createOcupacionSchema.safeParse(dataToValidate)

  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }
    return {
      success: false,
      fields,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  // Llamar al servicio de creación de ocupación
  const { error } = await createOcupacion(parsed.data)

  if (error) {
    return {
      success: false,
      errors: { general: [error] }
    }
  }

  return {
    success: true
  }
}

export async function updateOcupacionAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(payload)

  const parsed = updateOcupacionSchema.safeParse(formData)

  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }
    return {
      success: false,
      fields,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  // Llamar al servicio de actualización
  const { error } = await updateOcupacion(parsed.data.ocupacionId, {
    plazaId: parsed.data.plazaId,
    patente: parsed.data.patente,
    tipoVehiculo: parsed.data.tipoVehiculo,
    modalidadOcupacion: parsed.data.modalidadOcupacion
  })

  if (error) {
    return {
      success: false,
      errors: { general: [error] }
    }
  }

  return {
    success: true
  }
}

export async function finalizarOcupacionAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(payload)

  const parsed = finalizarOcupacionSchema.safeParse(formData)

  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }
    return {
      success: false,
      fields,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  const { error } = await finalizarOcupacion(parsed.data)

  if (error) {
    return {
      success: false,
      errors: { general: [error] }
    }
  }

  revalidatePath('/admin/ocupaciones')

  return {
    success: true
  }
}

export async function updateMetodoPagoAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(payload)

  const parsed = updateMetodoPagoSchema.safeParse(formData)

  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }
    return {
      success: false,
      fields,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  const { error } = await updateMetodoPagoOcupacion(
    parsed.data.ocupacionId,
    parsed.data.metodoPago
  )

  if (error) {
    return {
      success: false,
      errors: { general: [error] }
    }
  }

  revalidatePath('/admin/ocupaciones')

  return {
    success: true
  }
}
