import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getPlazas } from '@/services/plazas'
import type { GetPlazasParams, Plaza } from '@/services/plazas/types'
import type { ApiResponse } from '@/types/api'

export const useGetPlazas = (
  params: GetPlazasParams,
  options?: Omit<UseQueryOptions<ApiResponse<Plaza[]>>, 'queryKey' | 'queryFn'>
) => {
  const { playaId, tipoPlaza } = params
  return useQuery<ApiResponse<Plaza[]>>({
    queryKey: ['plazas', playaId, tipoPlaza, params],
    queryFn: async () => await getPlazas(params),
    ...options
  })
}
