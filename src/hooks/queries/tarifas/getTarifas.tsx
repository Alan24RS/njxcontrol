import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getTarifas } from '@/services/tarifas'
import type { GetTarifasParams, Tarifa } from '@/services/tarifas/types'
import type { ApiResponse } from '@/types/api'

export const useGetTarifas = (
  params: Partial<GetTarifasParams> & { playaId?: string },
  options?: Omit<UseQueryOptions<ApiResponse<Tarifa[]>>, 'queryKey' | 'queryFn'>
) => {
  const { playaId } = params
  return useQuery<ApiResponse<Tarifa[]>>({
    queryKey: ['tarifas', playaId, params],
    queryFn: async () => await getTarifas(params as GetTarifasParams),
    ...options
  })
}
