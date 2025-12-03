'use server'

import { revalidatePath } from 'next/cache'

import {
  createAbono,
  type CreateAbonoParams,
  finalizarAbono,
  registrarPagoBoleta,
  type RegistrarPagoBoletaParams,
  verificarDeudaPorPatente
} from '@/services/abonos'

type CreateAbonoFormState = {
  success: boolean
  data?: any
  error?: string
}

export async function createAbonoAction(
  params: CreateAbonoParams
): Promise<CreateAbonoFormState> {
  try {
    const result = await createAbono(params)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/abonos')
    revalidatePath('/admin/abonos/nuevo')

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear abono'
    }
  }
}

export async function finalizarAbonoAction(
  playaId: string,
  plazaId: string,
  fechaHoraInicio: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await finalizarAbono(playaId, plazaId, fechaHoraInicio)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/abonos')

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al finalizar abono'
    }
  }
}

type RegistrarPagoFormState = {
  success: boolean
  data?: {
    montoPagadoTotal: number
    deudaPendiente: number
    estadoBoleta: string
  }
  error?: string
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function registrarPagoBoletaAction(
  prevState: RegistrarPagoFormState,
  payload: FormData
): Promise<RegistrarPagoFormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { general: ['Datos de formulario inválidos'] }
    }
  }

  const formData = Object.fromEntries(payload)

  const processedData = {
    playaId: formData.playaId as string,
    plazaId: formData.plazaId as string,
    fechaHoraInicioAbono: formData.fechaHoraInicioAbono as string,
    fechaGeneracionBoleta: formData.fechaGeneracionBoleta as string,
    monto: formData.monto ? Number(formData.monto) : 0,
    metodoPago: formData.metodoPago as string
  }

  if (!processedData.playaId || !processedData.plazaId) {
    return {
      success: false,
      errors: { general: ['Faltan datos de la boleta'] }
    }
  }

  if (!processedData.fechaHoraInicioAbono || !processedData.fechaGeneracionBoleta) {
    return {
      success: false,
      errors: { general: ['Faltan datos de fecha de la boleta'] }
    }
  }
  if (!processedData.monto || processedData.monto <= 0) {
    return {
      success: false,
      errors: { monto: ['El monto debe ser mayor a 0'] }
    }
  }

  if (!processedData.metodoPago) {
    return {
      success: false,
      errors: { metodoPago: ['Selecciona un método de pago'] }
    }
  }

  try {
    const result = await registrarPagoBoleta(processedData)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/abonos')
    revalidatePath(
      `/admin/abonos/${processedData.playaId}/${processedData.plazaId}/${processedData.fechaHoraInicioAbono}/boletas`
    )

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar pago'
    }
  }
}

export async function registrarPagoBoletaActionDirect(
  params: RegistrarPagoBoletaParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await registrarPagoBoleta(params)

    if (result.error) {
      return {
        success: false,
        error: result.error
      }
    }

    revalidatePath('/admin/abonos')
    revalidatePath(
      `/admin/abonos/${params.playaId}/${params.plazaId}/${params.fechaHoraInicioAbono}/boletas`
    )

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar pago'
    }
  }
}

export async function verificarDeudaPorPatenteAction(
  patente: string,
  playaId: string
) {
  try {
    const result = await verificarDeudaPorPatente(patente, playaId)

    if (result.error) {
      return {
        data: null,
        error: result.error
      }
    }

    return {
      data: result.data,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error al verificar deuda por patente'
    }
  }
}
