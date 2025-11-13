'use server'

import { revalidatePath } from 'next/cache'

import { createPlazaSchema } from '@/schemas/plaza'
import { createPlaza, deletePlaza } from '@/services/plazas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type DeleteFormState = {
  success: boolean
  error?: string
}

export async function createPlazaAction(
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

  // Convertir tipoPlazaId de string a number para la validación
  const processedData = {
    ...formData,
    tipoPlazaId: formData.tipoPlazaId ? Number(formData.tipoPlazaId) : undefined
  }

  const parsed = createPlazaSchema.safeParse(processedData)

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

  // Obtener la playa seleccionada del payload
  const playaId = formData.playaId?.toString()

  if (!playaId) {
    return {
      success: false,
      errors: { general: ['Debe seleccionar una playa'] }
    }
  }

  // Convertir y validar el tipo de plaza
  const tipoPlazaId = Number(parsed.data.tipoPlazaId)

  if (isNaN(tipoPlazaId) || tipoPlazaId <= 0) {
    return {
      success: false,
      errors: {
        tipoPlazaId: ['Debe seleccionar un tipo de plaza válido']
      }
    }
  }

  try {
    const result = await createPlaza({
      playaId,
      tipoPlazaId,
      identificador: parsed.data.identificador || undefined,
      estado: parsed.data.estado
    })

    if (result.error) {
      return {
        success: false,
        errors: { general: [result.error] }
      }
    }

    revalidatePath('/admin/plazas')

    return { success: true }
  } catch (error) {
    console.error('Error creating plaza:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al crear la plaza'] }
    }
  }
}

export async function deletePlazaAction(
  plazaId: string
): Promise<DeleteFormState> {
  try {
    const result = await deletePlaza(plazaId)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/plazas')
    revalidatePath('/admin')

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deletePlazaAction:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar la plaza'
    }
  }
}
