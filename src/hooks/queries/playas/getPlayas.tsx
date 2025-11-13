import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getPlayasAction } from '@/app/admin/playas/queries'
import type { GetPlayasParams, Playa } from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export const useGetPlayas = (
  params?: GetPlayasParams,
  options?: Omit<UseQueryOptions<ApiResponse<Playa[]>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Playa[]>>({
    queryKey: ['playas', params],
    queryFn: async () => await getPlayasAction(params),
    ...options
  })
}
