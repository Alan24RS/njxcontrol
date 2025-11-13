'use server'

import { revalidatePath } from 'next/cache'

import { updatePlazaFormSchema } from '@/schemas/plaza'
import { updatePlaza } from '@/services/plazas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function updatePlazaAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const plazaId = payload.get('id') as string
  if (!plazaId) {
    return {
      success: false,
      errors: { error: ['ID de plaza requerido'] }
    }
  }

  const formData = Object.fromEntries(payload)

  // Convertir tipoPlazaId a número para validación
  const processedData = {
    ...formData,
    tipoPlazaId: formData.tipoPlazaId ? formData.tipoPlazaId.toString() : ''
  }

  const parsed = updatePlazaFormSchema.safeParse(processedData)

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

  try {
    const updateData = {
      id: plazaId,
      identificador: parsed.data.identificador || null,
      tipoPlazaId: parseInt(parsed.data.tipoPlazaId),
      estado: parsed.data.estado
    }

    const result = await updatePlaza(updateData)

    if (result.error) {
      return {
        success: false,
        errors: { general: [result.error] }
      }
    }

    revalidatePath('/admin/plazas')
    revalidatePath(`/admin/plazas/${plazaId}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Error updating plaza:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al actualizar la plaza'] }
    }
  }
}
