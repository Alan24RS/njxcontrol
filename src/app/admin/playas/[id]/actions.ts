'use server'

import { revalidatePath } from 'next/cache'

import { PlayaEstado } from '@/constants/playaEstado'
import { updatePlayaSchema } from '@/schemas/playa'
import { updatePlaya, updatePlayaEstado } from '@/services/playas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function updatePlayaEstadoAction(
  playaId: string,
  estado: PlayaEstado
) {
  try {
    const result = await updatePlayaEstado(playaId, estado)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/playas')
    revalidatePath(`/admin/playas/${playaId}`)

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('Error updating playa estado:', error)
    return {
      success: false,
      error: 'Error inesperado al actualizar el estado'
    }
  }
}

export async function updatePlayaAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const playaId = payload.get('id') as string
  if (!playaId) {
    return {
      success: false,
      errors: { error: ['ID de playa requerido'] }
    }
  }

  const formData = Object.fromEntries(payload)

  // Convertir campos numéricos
  const processedData = {
    ...formData,
    latitud: formData.latitud ? Number(formData.latitud) : 0,
    longitud: formData.longitud ? Number(formData.longitud) : 0
  }

  const parsed = updatePlayaSchema.safeParse(processedData)

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
    const result = await updatePlaya(playaId, {
      nombre: parsed.data.nombre || null,
      descripcion: parsed.data.descripcion,
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
    revalidatePath(`/admin/playas/${playaId}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Error updating playa:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al actualizar la playa'] }
    }
  }
}
