import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getTiposPlaza } from '@/services/tipos-plaza'
import type {
  GetTiposPlazaParams,
  TipoPlaza
} from '@/services/tipos-plaza/types'
import type { ApiResponse } from '@/types/api'

export const useGetTiposPlaza = (
  params: GetTiposPlazaParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<TipoPlaza[]>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { playaId } = params
  return useQuery<ApiResponse<TipoPlaza[]>>({
    queryKey: ['tipos-plaza', playaId, params],
    queryFn: async () => await getTiposPlaza(params),
    ...options
  })
}
