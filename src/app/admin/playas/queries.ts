'use server'

import { getPlaya, getPlayas } from '@/services/playas'
import { getPlayasBasicas } from '@/services/playas/getPlayasBasicas'
import { getPlayasCercanas } from '@/services/playas/getPlayasCercanas'
import type {
  GetPlayasCercanasParams,
  GetPlayasParams,
  PlayaBasica
} from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export async function getPlayaAction(id: string) {
  return await getPlaya(id)
}

export async function getPlayasAction(params?: GetPlayasParams) {
  return await getPlayas(params)
}

export async function getPlayasBasicasAction(args?: GetPlayasParams) {
  return await getPlayasBasicas({ args })
}

export async function getPlayasCercanasAction(params: GetPlayasCercanasParams) {
  return await getPlayasCercanas(params)
}

// Server action sin caché para llamadas desde el cliente (react-query)
export async function getUserPlayasAction(): Promise<
  ApiResponse<PlayaBasica[]>
> {
  // Llamar directamente a getPlayas sin unstable_cache
  return (await getPlayas({
    select: 'playa_id, nombre, direccion, descripcion',
    limit: 9999
  })) as ApiResponse<PlayaBasica[]>
}
