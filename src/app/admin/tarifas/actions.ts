'use server'

import { revalidatePath } from 'next/cache'

import { createTarifaSchema } from '@/schemas/tarifa'
import { createTarifa, deleteTarifa } from '@/services/tarifas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type DeleteFormState = {
  success: boolean
  error?: string
}

export type DeleteTarifaParams = {
  playaId: string
  tipoPlazaId: number
  modalidadOcupacion: string
  tipoVehiculo: string
}

export async function createTarifaAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const formData = Object.fromEntries(payload)

  const precioBaseValue = formData.precioBase as string
  const precioBaseNumber =
    precioBaseValue === '' ? undefined : Number(precioBaseValue)

  const dataToValidate = {
    playaId: formData.playaId as string,
    tipoPlazaId: Number(formData.tipoPlazaId) || 0,
    modalidadOcupacion: formData.modalidadOcupacion as string,
    tipoVehiculo: formData.tipoVehiculo as string,
    precioBase: precioBaseNumber
  }

  const parsed = createTarifaSchema.safeParse(dataToValidate)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  const result = await createTarifa(parsed.data)

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/tarifas')

  return {
    success: true
  }
}

export async function deleteTarifaAction({
  playaId,
  tipoPlazaId,
  modalidadOcupacion,
  tipoVehiculo
}: DeleteTarifaParams): Promise<DeleteFormState> {
  try {
    const result = await deleteTarifa({
      playaId,
      tipoPlazaId,
      modalidadOcupacion,
      tipoVehiculo
    })

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/tarifas')
    revalidatePath('/admin')

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deleteTarifaAction:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar la tarifa'
    }
  }
}
