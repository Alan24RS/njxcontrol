'use server'

import { revalidatePath } from 'next/cache'

import { createTipoPlazaSchema } from '@/schemas/tipo-plaza'
import { createTipoPlaza, deleteTipoPlaza } from '@/services/tipos-plaza'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type DeleteFormState = {
  success: boolean
  error?: string
  message?: string
}

export async function createTipoPlazaAction(
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

  // Para arrays, necesitamos usar getAll() en lugar de Object.fromEntries
  const caracteristicas = payload.getAll('caracteristicas')

  const dataToValidate = {
    nombre: formData.nombre as string,
    descripcion: formData.descripcion as string,
    playaId: formData.playaId as string,
    caracteristicas: caracteristicas.map(Number)
  }

  const parsed = createTipoPlazaSchema.safeParse(dataToValidate)

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

  const result = await createTipoPlaza({
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion || '',
    caracteristicas: parsed.data.caracteristicas.map(Number),
    playaId: parsed.data.playaId
  })

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  // Revalidar el caché como respaldo
  revalidatePath('/admin/tipos-plaza')

  return {
    success: true
  }
}

export async function deleteTipoPlazaAction(
  tipoPlazaId: number,
  playaId: string
): Promise<DeleteFormState> {
  try {
    const result = await deleteTipoPlaza(tipoPlazaId, playaId)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/tipos-plaza')
    revalidatePath('/admin')

    return {
      success: true,
      message: result.data?.message || 'Tipo de plaza eliminado correctamente'
    }
  } catch (error) {
    console.error('Error in deleteTipoPlazaAction:', error)
    return {
      success: false,
      error: 'Error inesperado al eliminar el tipo de plaza'
    }
  }
}
