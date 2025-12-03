import { unstable_cache } from 'next/cache'

import { getPlayas } from '@/services/playas/getPlayas'
import type { GetPlayasParams, PlayaBasica } from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

// Cache optimizado de 15 minutos para playas básicas
export const getPlayasBasicas = unstable_cache(
  async ({
    args
  }: {
    args?: GetPlayasParams
  } = {}): Promise<ApiResponse<PlayaBasica[]>> =>
    (await getPlayas({
      select: 'playa_id, nombre, direccion, descripcion, horario',
      ...args
    })) as ApiResponse<PlayaBasica[]>,
  ['playas-basicas'], // cache key
  {
    revalidate: 15 * 60, // 15 minutos
    tags: ['playas'] // para invalidación manual si es necesario
  }
)
