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

export async function registrarPagoBoletaAction(
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
