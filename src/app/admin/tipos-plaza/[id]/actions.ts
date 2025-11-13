'use server'

import { revalidatePath } from 'next/cache'

import { updateTipoPlazaSchema } from '@/schemas/tipo-plaza'
import { updateTipoPlaza } from '@/services/tipos-plaza'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function updateTipoPlazaAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const tipoPlazaId = payload.get('id') as string
  if (!tipoPlazaId) {
    return {
      success: false,
      errors: { error: ['ID de tipo de plaza requerido'] }
    }
  }

  const formData = Object.fromEntries(payload)

  // Convertir campos necesarios
  const processedData = {
    ...formData,
    id: parseInt(tipoPlazaId),
    caracteristicas: payload
      .getAll('caracteristicas')
      .map((id) => parseInt(id.toString()))
  }

  const parsed = updateTipoPlazaSchema.safeParse(processedData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      if (key !== 'caracteristicas') {
        fields[key] = formData[key].toString()
      }
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  try {
    const updateData = {
      id: parsed.data.id,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      caracteristicas: parsed.data.caracteristicas
    }

    const result = await updateTipoPlaza(updateData)

    if (result.error) {
      return {
        success: false,
        errors: { general: [result.error] }
      }
    }

    revalidatePath('/admin/tipos-plaza')
    revalidatePath(`/admin/tipos-plaza/${tipoPlazaId}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Error updating tipo plaza:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al actualizar el tipo de plaza'] }
    }
  }
}
