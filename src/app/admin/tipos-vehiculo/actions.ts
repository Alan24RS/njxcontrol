'use server'

import { revalidatePath } from 'next/cache'

import {
  CreateTipoVehiculoPlayaRequest,
  createTipoVehiculoPlayaSchema
} from '@/schemas/tipo-vehiculo-playa'
import { createTipoVehiculoPlaya } from '@/services/tipos-vehiculo'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function createTipoVehiculoAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const fields = Object.fromEntries(formData.entries()) as Record<
    string,
    string
  >

  const parsed = createTipoVehiculoPlayaSchema.safeParse(fields)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    return {
      success: false,
      fields,
      errors: fieldErrors
    }
  }

  const data: CreateTipoVehiculoPlayaRequest = parsed.data

  const result = await createTipoVehiculoPlaya(data)

  if (result.error) {
    return {
      success: false,
      fields,
      errors: {
        general: [result.error]
      }
    }
  }

  revalidatePath('/admin/tipos-vehiculo')

  return {
    success: true
  }
}
