'use server'

import { revalidatePath } from 'next/cache'

import { createPlayaSchema } from '@/schemas/playa'
import { createPlaya, deletePlaya } from '@/services/playas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type DeleteFormState = {
  success: boolean
  error?: string
}

export async function createPlayaAction(
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

  // Convertir campos numéricos por si acaso no llegan como números
  const processedData = {
    ...formData,
    latitud: formData.latitud ? Number(formData.latitud) : 0,
    longitud: formData.longitud ? Number(formData.longitud) : 0
  }

  const parsed = createPlayaSchema.safeParse(processedData)

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

  // Llamar al servicio para crear la playa
  const result = await createPlaya({
    nombre: parsed.data.nombre || '',
    descripcion: parsed.data.descripcion || '',
    direccion: parsed.data.direccion,
    ciudad: parsed.data.ciudad,
    provincia: parsed.data.provincia,
    latitud: parsed.data.latitud,
    longitud: parsed.data.longitud,
    horario: parsed.data.horario
  })

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/playas')

  return {
    success: true
  }
}

export async function deletePlayaAction(
  playaId: string
): Promise<DeleteFormState> {
  try {
    const result = await deletePlaya(playaId)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/playas')
    revalidatePath('/admin')

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deletePlayaAction:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar la playa'
    }
  }
}
