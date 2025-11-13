import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getPlayeros } from '@/services/playeros'
import type { GetPlayerosParams, PlayeroPlaya } from '@/services/playeros/types'
import type { ApiResponse } from '@/types/api'
export const useGetPlayeros = (
  params: GetPlayerosParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlayeroPlaya[]>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { playaId, page, limit, query, sortBy } = params

  return useQuery<ApiResponse<PlayeroPlaya[]>>({
    queryKey: ['playeros', playaId, page, limit, query, sortBy],
    queryFn: async () => await getPlayeros(params),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}
