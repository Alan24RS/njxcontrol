'use server'

import { revalidatePath } from 'next/cache'

import type { MetodoPago } from '@/constants/metodoPago'
import { createMetodoPagoPlayaSchema } from '@/schemas/metodo-pago-playa'
import { createMetodoPagoPlaya } from '@/services/metodos-pago-playa'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function createMetodoPagoAction(
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
    metodoPago: formData.metodoPago as string,
    playaId: formData.playaId as string
  }

  const parsed = createMetodoPagoPlayaSchema.safeParse(dataToValidate)

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

  const result = await createMetodoPagoPlaya({
    metodoPago: parsed.data.metodoPago as MetodoPago,
    playaId: parsed.data.playaId
  })

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/metodos-pago')

  return {
    success: true
  }
}
