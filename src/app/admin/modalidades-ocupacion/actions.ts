'use server'

import { revalidatePath } from 'next/cache'

import type { ModalidadOcupacion } from '@/constants/modalidadOcupacion'
import { createModalidadOcupacionSchema } from '@/schemas/modalidad-ocupacion'
import { createModalidadOcupacion } from '@/services/modalidades-ocupacion'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function createModalidadOcupacionAction(
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

  const dataToValidate = {
    modalidadOcupacion: formData.modalidadOcupacion as string,
    playaId: formData.playaId as string
  }

  const parsed = createModalidadOcupacionSchema.safeParse(dataToValidate)

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

  const result = await createModalidadOcupacion({
    modalidadOcupacion: parsed.data.modalidadOcupacion as ModalidadOcupacion,
    playaId: parsed.data.playaId
  })

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/modalidades-ocupacion')

  return {
    success: true
  }
}
