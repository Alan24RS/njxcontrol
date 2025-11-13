'use server'

import { revalidatePath } from 'next/cache'

import { updateTarifaSchema } from '@/schemas/tarifa'
import { updateTarifa } from '@/services/tarifas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function updateTarifaAction(
  playaId: string,
  tipoPlazaId: number,
  modalidadOcupacion: string,
  tipoVehiculo: string,
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

  const parsed = updateTarifaSchema.safeParse({
    precioBase: precioBaseNumber
  })

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

  const result = await updateTarifa(
    playaId,
    tipoPlazaId,
    modalidadOcupacion,
    tipoVehiculo,
    parsed.data
  )

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/tarifas')
  revalidatePath(
    `/admin/tarifas/${playaId}/${tipoPlazaId}/${modalidadOcupacion}/${tipoVehiculo}`
  )

  return {
    success: true
  }
}
